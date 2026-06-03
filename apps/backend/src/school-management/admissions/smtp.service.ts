import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Per-org SMTP config keys (org-settings are stored UPPER_SNAKE_CASE, encrypted).
 * Each key falls back to an `CH_SMTP_*` environment variable when the org has
 * not configured its own sender. We deliberately use a generic SMTP transport
 * (e.g. Infomaniak, CH) — not a hard-wired US provider.
 */
export const SMTP_SETTING_KEYS = {
  host: 'SMTP_HOST',
  port: 'SMTP_PORT',
  secure: 'SMTP_SECURE',
  user: 'SMTP_USER',
  password: 'SMTP_PASSWORD',
  fromEmail: 'SMTP_FROM_EMAIL',
  fromName: 'SMTP_FROM_NAME',
} as const;

interface ResolvedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string | null;
}

@Injectable()
export class SmtpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly organizationSettings: OrganizationSettingsService,
  ) {}

  /** True when the org (or env fallback) has a usable SMTP configuration. */
  async isConfigured(organizationId: string): Promise<boolean> {
    try {
      await this.resolveConfig(organizationId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send an email through the org's SMTP server. Throws on misconfiguration or
   * transport failure — the caller is responsible for persisting the outcome.
   */
  async send(params: {
    organizationId: string;
    to: string;
    toName?: string | null;
    subject: string;
    html: string;
  }): Promise<{ messageId: string }> {
    const cfg = await this.resolveConfig(params.organizationId);

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.password },
    });

    const from = cfg.fromName
      ? `"${cfg.fromName}" <${cfg.fromEmail}>`
      : cfg.fromEmail;
    const to = params.toName ? `"${params.toName}" <${params.to}>` : params.to;

    const info = await transporter.sendMail({
      from,
      to,
      subject: params.subject,
      html: params.html,
    });

    return { messageId: info.messageId };
  }

  /**
   * Resolve SMTP config from org-settings with env fallback. Throws
   * ServiceUnavailableException when the mandatory fields are missing.
   */
  private async resolveConfig(
    organizationId: string,
  ): Promise<ResolvedSmtpConfig> {
    const resolve = async (
      settingKey: string,
      envKey: string,
    ): Promise<string | null> => {
      const fromOrg = await this.organizationSettings.getDecryptedValue(
        organizationId,
        settingKey,
      );
      if (fromOrg && fromOrg.trim()) return fromOrg.trim();
      const fromEnv = this.configService.get<string>(`CH_${envKey}`);
      return fromEnv && fromEnv.trim() ? fromEnv.trim() : null;
    };

    const host = await resolve(SMTP_SETTING_KEYS.host, SMTP_SETTING_KEYS.host);
    const user = await resolve(SMTP_SETTING_KEYS.user, SMTP_SETTING_KEYS.user);
    const password = await resolve(
      SMTP_SETTING_KEYS.password,
      SMTP_SETTING_KEYS.password,
    );
    const fromEmail =
      (await resolve(
        SMTP_SETTING_KEYS.fromEmail,
        SMTP_SETTING_KEYS.fromEmail,
      )) ?? user;

    if (!host || !user || !password || !fromEmail) {
      throw new ServiceUnavailableException(
        'SMTP is not configured for this organization',
      );
    }

    const portRaw = await resolve(
      SMTP_SETTING_KEYS.port,
      SMTP_SETTING_KEYS.port,
    );
    const secureRaw = await resolve(
      SMTP_SETTING_KEYS.secure,
      SMTP_SETTING_KEYS.secure,
    );
    const fromName = await resolve(
      SMTP_SETTING_KEYS.fromName,
      SMTP_SETTING_KEYS.fromName,
    );

    const port = portRaw ? Number.parseInt(portRaw, 10) || 587 : 587;
    // Default to implicit TLS when port 465, otherwise STARTTLS (secure=false).
    const secure = secureRaw
      ? secureRaw.toLowerCase() === 'true'
      : port === 465;

    return { host, port, secure, user, password, fromEmail, fromName };
  }
}
