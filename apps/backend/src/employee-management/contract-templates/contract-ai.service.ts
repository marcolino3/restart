import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { sanitizeRichHtml } from '@/common/util/sanitize-rich-html';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { Organization } from '@/organizations/entities/organization.entity';
import {
  buildContractVariables,
  CONTRACT_TEMPLATE_PLACEHOLDERS,
} from './contract-placeholders';

/**
 * Per-org AI config keys (org-settings, encrypted at rest). Mistral only —
 * contract drafts carry personal data (name, salary, AHV), so the provider
 * must be EU-hosted (GDPR; no US vendors for data).
 */
export const CONTRACT_AI_SETTING_KEYS = {
  apiKey: 'CONTRACT_AI_MISTRAL_API_KEY',
  model: 'CONTRACT_AI_MODEL',
} as const;

export const CONTRACT_AI_DEFAULT_MODEL = 'mistral-large-latest';

const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';

const HTML_RULES =
  'Antworte AUSSCHLIESSLICH mit dem HTML-Fragment des Vertragstexts — kein Markdown, ' +
  'keine Code-Fences, kein <html>/<body>. Erlaubte Tags: p, br, b, strong, i, em, u, ' +
  'ul, ol, li, blockquote, h1-h4, hr. Sprache Deutsch (Schweiz, ss statt ß), ' +
  'Schweizer Arbeitsrecht (OR).';

@Injectable()
export class ContractAiService {
  private readonly logger = new Logger(ContractAiService.name);

  constructor(
    private readonly organizationSettings: OrganizationSettingsService,
    @InjectRepository(Organization)
    private readonly orgsRepo: Repository<Organization>,
  ) {}

  /** True when the org has stored a Mistral API key. */
  async isConfigured(organizationId: string): Promise<boolean> {
    const key = await this.organizationSettings.getDecryptedValue(
      organizationId,
      CONTRACT_AI_SETTING_KEYS.apiKey,
    );
    return Boolean(key && key.trim());
  }

  /**
   * Drafts the contract body for one concrete contract: the employee/contract
   * facts are passed as grounding data, the result comes back sanitized and
   * ready for the review editor.
   */
  async draftContractBody(
    organizationId: string,
    contract: EmployeeContract,
    instructions: string,
  ): Promise<string> {
    const organization = await this.orgsRepo.findOne({
      where: { id: organizationId },
    });
    const variables = buildContractVariables(contract, organization);
    const facts = Object.entries(variables)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join('\n');

    const system =
      'Du bist Assistent für Schweizer Arbeitsverträge an Privatschulen. ' +
      'Erstelle einen vollständigen, professionellen Arbeitsvertrag als HTML. ' +
      'Verwende die gelieferten Fakten wörtlich; erfinde keine Personendaten. ' +
      HTML_RULES;
    const user = `Fakten zum Vertrag:\n${facts}\n\nAuftrag: ${instructions.trim() || 'Erstelle einen unbefristeten Standard-Arbeitsvertrag.'}`;

    return this.chat(organizationId, system, user);
  }

  /**
   * Drafts a reusable template: placeholders stay as {{token}} so the result
   * can be saved as a contract template.
   */
  async draftTemplateBody(
    organizationId: string,
    instructions: string,
  ): Promise<string> {
    const tokens = CONTRACT_TEMPLATE_PLACEHOLDERS.map(
      (token) => `{{${token}}}`,
    ).join(', ');
    const system =
      'Du bist Assistent für Schweizer Arbeitsvertrags-VORLAGEN an Privatschulen. ' +
      'Erstelle eine wiederverwendbare Vorlage als HTML. Setze für alle variablen ' +
      `Angaben ausschliesslich diese Platzhalter unverändert ein: ${tokens}. ` +
      'Erfinde keine weiteren Platzhalter und keine konkreten Personendaten. ' +
      HTML_RULES;
    const user = `Auftrag: ${instructions.trim() || 'Erstelle eine Vorlage für einen unbefristeten Arbeitsvertrag einer Lehrperson.'}`;

    return this.chat(organizationId, system, user);
  }

  private async chat(
    organizationId: string,
    system: string,
    user: string,
  ): Promise<string> {
    const apiKey = await this.organizationSettings.getDecryptedValue(
      organizationId,
      CONTRACT_AI_SETTING_KEYS.apiKey,
    );
    if (!apiKey || !apiKey.trim()) {
      throw new ServiceUnavailableException(
        'AI is not configured for this organization',
      );
    }
    const model =
      (await this.organizationSettings.getDecryptedValue(
        organizationId,
        CONTRACT_AI_SETTING_KEYS.model,
      )) || CONTRACT_AI_DEFAULT_MODEL;

    let response: Response;
    try {
      response = await fetch(MISTRAL_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: model.trim(),
          temperature: 0.3,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (error) {
      this.logger.warn(
        `Mistral request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadGatewayException('AI provider is not reachable');
    }

    if (!response.ok) {
      // Never forward the provider body to the client — it may echo request
      // details. Log it server-side (truncated) for diagnosis.
      const body = await response.text().catch(() => '');
      this.logger.warn(
        `Mistral returned HTTP ${response.status}: ${body.slice(0, 500)}`,
      );
      // Map known provider error types to actionable messages without
      // forwarding the raw provider body.
      let errorType = '';
      try {
        errorType = (JSON.parse(body) as { type?: string }).type ?? '';
      } catch {
        // non-JSON body — keep the generic message
      }
      if (errorType === 'tier_not_allowed') {
        throw new BadGatewayException(
          `Model "${model.trim()}" is not available in your Mistral subscription tier — select a smaller model in the AI settings`,
        );
      }
      throw new BadGatewayException(
        response.status === 401
          ? 'AI API key was rejected by the provider'
          : `AI provider request failed (HTTP ${response.status})`,
      );
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw || !raw.trim()) {
      throw new BadGatewayException('AI provider returned an empty draft');
    }
    return sanitizeRichHtml(stripCodeFences(raw));
  }
}

/** Models occasionally wrap HTML in ```html fences despite instructions. */
function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
}
