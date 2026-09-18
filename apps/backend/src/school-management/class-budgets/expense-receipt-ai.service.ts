import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { CONTRACT_AI_SETTING_KEYS } from '@/employee-management/contract-templates/contract-ai.service';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassBudgetAccessService } from './class-budget-access.service';
import { ExpenseReceiptSuggestion } from './dto/expense-receipt-suggestion.object';
import { ExpenseCategory } from './entities/expense-category.entity';
import { ExpenseReceiptsService } from './expense-receipts.service';
import {
  buildExpenseAiRequest,
  EXPENSE_AI_DEFAULT_MODELS,
  EXPENSE_AI_DEFAULT_PROVIDER,
  ExpenseAiVendor,
  isExpenseAiProvider,
  readExpenseAiText,
} from './lib/expense-ai-providers';
import {
  buildReceiptPrompt,
  parseReceiptSuggestion,
} from './lib/receipt-suggestion';

/**
 * Per-org config keys (org-settings, encrypted at rest). Provider "contracts"
 * — the default — reuses the Mistral key of the contract AI settings, so an
 * org that already set up AI stays on the EU provider without extra setup.
 * Other providers are an explicit opt-in by an org admin.
 */
export const EXPENSE_AI_SETTING_KEYS = {
  provider: 'EXPENSE_AI_PROVIDER',
  apiKey: 'EXPENSE_AI_API_KEY',
  model: 'EXPENSE_AI_MODEL',
} as const;

const REQUEST_TIMEOUT_MS = 60_000;

interface ResolvedAiConfig {
  vendor: ExpenseAiVendor;
  apiKey: string;
  model: string;
}

@Injectable()
export class ExpenseReceiptAiService {
  private readonly logger = new Logger(ExpenseReceiptAiService.name);

  constructor(
    private readonly organizationSettings: OrganizationSettingsService,
    @InjectRepository(ExpenseCategory)
    private readonly categoriesRepo: Repository<ExpenseCategory>,
    private readonly receipts: ExpenseReceiptsService,
    private readonly access: ClassBudgetAccessService,
  ) {}

  async isConfigured(organizationId: string): Promise<boolean> {
    return (await this.resolveConfig(organizationId)) !== null;
  }

  /**
   * Reads the receipt of a class the caller may access and returns what the
   * AI found. Only the file and the org's category names leave the system.
   */
  async analyze(
    schoolClassId: string,
    fileId: string,
    organizationId: string,
    user: TokenPayload,
  ): Promise<ExpenseReceiptSuggestion> {
    await this.access.assertSchoolClassAccessible(
      schoolClassId,
      organizationId,
      user,
    );
    const config = await this.resolveConfig(organizationId);
    if (!config) {
      throw new ServiceUnavailableException(
        'AI is not configured for this organization',
      );
    }

    let file: Buffer;
    try {
      file = await this.receipts.read(organizationId, schoolClassId, fileId);
    } catch {
      throw new NotFoundException(`Receipt ${fileId} not found`);
    }

    const categories = await this.categoriesRepo.find({
      where: { organizationId, isArchived: false },
      select: { id: true, name: true },
      order: { position: 'ASC' },
    });

    const text = await this.callProvider(config, {
      prompt: buildReceiptPrompt(categories),
      file: {
        base64: file.toString('base64'),
        mimeType: this.receipts.mimeOf(fileId),
      },
    });
    const suggestion = parseReceiptSuggestion(text, categories);
    if (!suggestion) {
      throw new BadGatewayException('AI provider returned an unusable answer');
    }
    return suggestion;
  }

  private async setting(
    organizationId: string,
    key: string,
  ): Promise<string | null> {
    const value = await this.organizationSettings.getDecryptedValue(
      organizationId,
      key,
    );
    return value && value.trim() ? value.trim() : null;
  }

  private async resolveConfig(
    organizationId: string,
  ): Promise<ResolvedAiConfig | null> {
    const stored = await this.setting(
      organizationId,
      EXPENSE_AI_SETTING_KEYS.provider,
    );
    const provider = isExpenseAiProvider(stored)
      ? stored
      : EXPENSE_AI_DEFAULT_PROVIDER;
    const vendor: ExpenseAiVendor =
      provider === 'contracts' ? 'mistral' : provider;

    const apiKey = await this.setting(
      organizationId,
      provider === 'contracts'
        ? CONTRACT_AI_SETTING_KEYS.apiKey
        : EXPENSE_AI_SETTING_KEYS.apiKey,
    );
    if (!apiKey) return null;

    // "contracts" always runs on the vision default: the contract model is a
    // text model, and EXPENSE_AI_MODEL may still hold a model name of a
    // previously selected vendor.
    const model =
      (provider === 'contracts'
        ? null
        : await this.setting(organizationId, EXPENSE_AI_SETTING_KEYS.model)) ??
      EXPENSE_AI_DEFAULT_MODELS[vendor];
    return { vendor, apiKey, model };
  }

  private async callProvider(
    config: ResolvedAiConfig,
    payload: { prompt: string; file: { base64: string; mimeType: string } },
  ): Promise<string> {
    const request = buildExpenseAiRequest({ ...config, ...payload });

    let response: Response;
    try {
      response = await fetch(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...request.headers },
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(
        `Receipt AI (${config.vendor}) not reachable: ${(error as Error).name}`,
      );
      throw new BadGatewayException('AI provider is not reachable');
    }

    if (!response.ok) {
      // Status only — provider error bodies can echo parts of the request.
      this.logger.warn(
        `Receipt AI (${config.vendor}) answered ${response.status}`,
      );
      if (response.status === 401 || response.status === 403) {
        throw new BadGatewayException('AI provider rejected the API key');
      }
      if (response.status === 429) {
        throw new BadGatewayException('AI provider rate limit reached');
      }
      throw new BadGatewayException('AI provider request failed');
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new BadGatewayException('AI provider returned an unusable answer');
    }
    const text = readExpenseAiText(config.vendor, json);
    if (!text) {
      throw new BadGatewayException('AI provider returned an empty answer');
    }
    return text;
  }
}
