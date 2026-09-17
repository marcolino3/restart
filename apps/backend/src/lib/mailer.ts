import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
// Standalone nodemailer transport for better-auth callbacks (magic-link).
// Kept separate from the Nest MailService because better-auth's plugin
// callbacks run outside the Nest DI container.
import * as nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.SMTP_USER ?? '',
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET ?? '',
      refreshToken: process.env.GOOGLE_MAIL_REFRESH_TOKEN ?? '',
    },
  });
  return cachedTransporter;
}

export const mailer = {
  sendAccountEmailVerification: async (
    to: string,
    url: string,
  ): Promise<void> => {
    if (process.env.NODE_ENV === 'test') {
      if (process.env.E2E_MAIL_DIR) {
        await mkdir(process.env.E2E_MAIL_DIR, { recursive: true });
        await writeFile(
          join(process.env.E2E_MAIL_DIR, `${randomUUID()}.json`),
          JSON.stringify({ kind: 'account-email', to, url }),
          { mode: 0o600 },
        );
      }
      return;
    }
    await getTransporter().sendMail({
      from: process.env.SMTP_USER ?? '',
      to,
      subject: 'Restart – E-Mail-Wechsel bestätigen',
      text: `Du hast einen Wechsel deiner Login-E-Mail angefordert. Bestätige innerhalb von 24 Stunden mit deinem angemeldeten Konto: ${url}\nDie Änderung wird erst nach Bestätigung der alten und der neuen Adresse durchgeführt. Falls du dies nicht angefordert hast, bestätige den Link nicht.`,
    });
  },
  sendEmployeeInvitation: async (
    to: string,
    url: string,
    organization: string,
  ): Promise<void> => {
    if (process.env.NODE_ENV === 'test') {
      if (process.env.E2E_MAIL_DIR) {
        await mkdir(process.env.E2E_MAIL_DIR, { recursive: true });
        await writeFile(
          join(process.env.E2E_MAIL_DIR, `${randomUUID()}.json`),
          JSON.stringify({ to, url, organization }),
          { mode: 0o600 },
        );
      }
      return;
    }
    await getTransporter().sendMail({
      from: process.env.SMTP_USER ?? '',
      to,
      subject: 'Einladung zu Restart',
      text: `Du wurdest zu ${organization} eingeladen. Melde dich mit dieser E-Mail-Adresse an und bestätige die Verknüpfung ausdrücklich: ${url}\nDer Link ist 48 Stunden gültig. Ohne Bestätigung wird dein Konto nicht verknüpft.`,
    });
  },
  sendMagicLink: async (to: string, magicLinkUrl: string): Promise<void> => {
    if (process.env.NODE_ENV === 'test') return;
    await getTransporter().sendMail({
      from: process.env.SMTP_USER ?? '',
      to,
      subject: 'Dein Login-Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2>Hallo,</h2>
          <p>Klicke auf den Button, um dich einzuloggen:</p>
          <a href="${magicLinkUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Jetzt einloggen
          </a>
          <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
            Dieser Link ist 15 Minuten gültig. Wenn du dich nicht einloggen wolltest, kannst du diese E-Mail ignorieren.
          </p>
        </div>
      `,
    });
  },

  // Onboarding invitation / password-setup e-mail. Sent via better-auth's
  // reset-password primitive (sendResetPassword callback) — the new employee
  // was created with a random password and sets their own here. Works both as
  // a first-time invitation and as a plain password reset.
  sendPasswordSetup: async (to: string, url: string): Promise<void> => {
    if (process.env.NODE_ENV === 'test') return;
    await getTransporter().sendMail({
      from: process.env.SMTP_USER ?? '',
      to,
      subject: 'Dein Zugang zu Restart – Passwort festlegen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2>Willkommen bei Restart</h2>
          <p>Dein Konto wurde angelegt. Klicke auf den Button, um dein Passwort festzulegen und dich erstmals einzuloggen:</p>
          <a href="${url}"
             style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Passwort festlegen
          </a>
          <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
            Wenn du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.
          </p>
        </div>
      `,
    });
  },
};
