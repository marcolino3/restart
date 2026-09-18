import {
  BadGatewayException,
  BadRequestException,
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
import {
  CONTRACT_AI_MAX_CURRENT_HTML_CHARS,
  CONTRACT_AI_MAX_MESSAGES,
  ContractAiChatMessageInput,
} from './dto/contract-ai-chat.input';
import { ContractAiChatResult } from './dto/contract-ai-chat.output';

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

const DRAFT_TAG_RE = /<contract-draft>([\s\S]*?)<\/contract-draft>/i;

const HTML_RULES =
  'Innerhalb von <contract-draft> steht AUSSCHLIESSLICH das HTML-Fragment des ' +
  'Vertragstexts — kein Markdown, keine Code-Fences, kein <html>/<body>. ' +
  'Erlaubte Tags: p, br, b, strong, i, em, u, ul, ol, li, blockquote, h1-h4, hr.';

/** Applicable labor law derived from the organization's location. */
function lawBasis(country?: string | null): string {
  const c = (country ?? '').trim().toLowerCase();
  if (!c || /schweiz|switzerland|suisse|svizzera|^ch$/.test(c)) {
    return 'Schweizer Arbeitsrecht (OR Art. 319 ff.)';
  }
  if (/deutschland|germany|^de$/.test(c)) {
    return 'deutsches Arbeitsrecht (u.a. BGB §§ 611a ff., Nachweisgesetz, BUrlG)';
  }
  if (/österreich|oesterreich|austria|^at$/.test(c)) {
    return 'österreichisches Arbeitsrecht (u.a. ABGB, AngG, UrlG)';
  }
  if (/liechtenstein|^li$/.test(c)) {
    return 'liechtensteinisches Arbeitsrecht (ABGB §§ 1173a ff.)';
  }
  return `das Arbeitsrecht des Landes «${(country ?? '').trim()}»`;
}

const dialogRules = (law: string) =>
  'Du führst einen Dialog, um einen Arbeitsvertrag für eine Privatschule zu erstellen. ' +
  'Ablauf: ' +
  '1) Kläre zuerst den Kontext mit gezielten Rückfragen (höchstens 3-4 pro Antwort): ' +
  'Rolle/Funktion und dazu passender Vertragstyp (unbefristet, befristet, Stundenlohn, ' +
  'Praktikum, Lehre, Stellvertretung), Pensum und Lohnmodell, gewünschte Inhalte und ' +
  'Klauseln (Probezeit, Kündigungsfristen, Ferien, Überstunden, Vertraulichkeit, ' +
  'Weiterbildung, Nebenbeschäftigung), Besonderheiten. ' +
  '2) Sobald genug Kontext vorhanden ist, liefere einen vollständigen Entwurf. ' +
  '3) Überarbeite danach auf Wunsch einzelne Abschnitte — gib dabei IMMER den ' +
  'kompletten aktualisierten Vertrag zurück, nie nur den geänderten Abschnitt. ' +
  `Rechtsgrundlage: ${law}; weise auf zwingende ` +
  'Bestimmungen hin, wenn ein Wunsch dagegen verstösst. ' +
  'Format: Antworte kurz als Klartext auf Deutsch (Schweiz, ss statt ß). ' +
  'Wenn — und nur wenn — du einen Entwurf oder eine überarbeitete Fassung lieferst, ' +
  'schliesse den Vertrag in <contract-draft>...</contract-draft> ein; Erklärungen und ' +
  'Fragen stehen ausserhalb davon. ' +
  HTML_RULES;

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
   * One dialog turn. Template mode (no contract) keeps {{token}} placeholders;
   * contract mode grounds the draft on the concrete contract's facts. The
   * caller passes the full history — nothing is stored server-side.
   */
  async chatDialog(
    organizationId: string,
    messages: ContractAiChatMessageInput[],
    currentHtml: string | null,
    contract: EmployeeContract | null,
  ): Promise<ContractAiChatResult> {
    if (messages.length === 0 || messages.length > CONTRACT_AI_MAX_MESSAGES) {
      throw new BadRequestException(
        `Chat history must contain 1-${CONTRACT_AI_MAX_MESSAGES} messages`,
      );
    }

    const organization = await this.orgsRepo.findOne({
      where: { id: organizationId },
    });
    const law = lawBasis(organization?.country);
    const system = contract
      ? this.contractSystemPrompt(organization, contract, law)
      : this.templateSystemPrompt(law);

    const chatMessages: { role: string; content: string }[] = [
      { role: 'system', content: system },
    ];
    if (currentHtml && currentHtml.trim()) {
      chatMessages.push({
        role: 'system',
        content: `Aktueller Vertragsstand im Editor (Basis für Überarbeitungen):\n${currentHtml.slice(0, CONTRACT_AI_MAX_CURRENT_HTML_CHARS)}`,
      });
    }
    for (const message of messages) {
      chatMessages.push({ role: message.role, content: message.content });
    }

    const raw = await this.chat(organizationId, chatMessages);

    const match = DRAFT_TAG_RE.exec(raw);
    if (!match) {
      return { reply: raw.trim(), html: null };
    }
    const html = sanitizeRichHtml(stripCodeFences(match[1]));
    const reply = raw.replace(match[0], '').trim();
    return { reply, html: html.trim() ? html : null };
  }

  private templateSystemPrompt(law: string): string {
    const tokens = CONTRACT_TEMPLATE_PLACEHOLDERS.map(
      (token) => `{{${token}}}`,
    ).join(', ');
    return (
      'Du erstellst eine wiederverwendbare Arbeitsvertrags-VORLAGE. Setze für ' +
      'alle variablen Angaben ausschliesslich diese Platzhalter unverändert ' +
      `ein: ${tokens}. Erfinde keine weiteren Platzhalter und keine konkreten ` +
      'Personendaten. ' +
      dialogRules(law)
    );
  }

  private contractSystemPrompt(
    organization: Organization | null,
    contract: EmployeeContract,
    law: string,
  ): string {
    const variables = buildContractVariables(contract, organization);
    const facts = Object.entries(variables)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join('\n');
    return (
      'Du erstellst einen konkreten Arbeitsvertrag. Verwende die folgenden ' +
      'Fakten wörtlich; erfinde keine Personendaten. Fehlen relevante Angaben, ' +
      'frage danach.\n' +
      `Fakten zum Vertrag:\n${facts}\n\n` +
      dialogRules(law)
    );
  }

  private async chat(
    organizationId: string,
    messages: { role: string; content: string }[],
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
          messages,
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
      if (response.status === 401) {
        throw new BadGatewayException(
          'AI API key was rejected by the provider',
        );
      }
      if (response.status === 429) {
        throw new BadGatewayException(
          'AI provider rate limit reached — wait a moment and try again',
        );
      }
      throw new BadGatewayException(
        `AI provider request failed (HTTP ${response.status})`,
      );
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw || !raw.trim()) {
      throw new BadGatewayException('AI provider returned an empty draft');
    }
    return raw;
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
