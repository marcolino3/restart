import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import {
  CONTRACT_AI_DEFAULT_MODEL,
  CONTRACT_AI_SETTING_KEYS,
} from '@/employee-management/contract-templates/contract-ai.service';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassBudgetAccessService } from './class-budget-access.service';
import { ExpenseAiModelList } from './dto/expense-ai-model-list.object';
import { ExpenseReceiptSuggestion } from './dto/expense-receipt-suggestion.object';
import { ExpenseCategory } from './entities/expense-category.entity';
import { ExpenseReceiptsService } from './expense-receipts.service';
import {
  classifyProviderError,
  EXPENSE_AI_ERRORS,
  ExpenseAiErrorCode,
  ProviderErrorInfo,
  readProviderError,
  retryDelayMs,
} from './lib/expense-ai-errors';
import {
  buildExpenseAiModelsRequest,
  parseExpenseAiModels,
} from './lib/expense-ai-models';
import {
  buildExpenseAiRequest,
  EXPENSE_AI_DEFAULT_MODELS,
  EXPENSE_AI_DEFAULT_PROVIDER,
  ExpenseAiProvider,
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
const MODELS_TIMEOUT_MS = 10_000;
const RETRY_FALLBACK_MS = 2_000;
const MAX_RETRY_DELAY_MS = 5_000;

/**
 * The provider's rate-limit headers tell which limit was hit (requests or
 * tokens, per minute or per month) — numbers only, nothing of the request.
 */
const rateLimitHeaders = (headers: Headers): string => {
  const parts: string[] = [];
  headers.forEach((value, name) => {
    if (/ratelimit|retry-after/i.test(name)) {
      parts.push(`${name}=${value.slice(0, 40)}`);
    }
  });
  return parts.length ? ` {${parts.join(', ')}}` : '';
};

/**
 * A 429 whose advertised limit is zero is not a rate limit: the key's
 * workspace has no API allowance at all (no active plan or billing), so
 * waiting or retrying never helps.
 */
const hasZeroAllowance = (response: Response): boolean => {
  if (response.status !== 429) return false;
  let zero = false;
  response.headers.forEach((value, name) => {
    if (/ratelimit-limit/i.test(name) && value.trim() === '0') zero = true;
  });
  return zero;
};

interface ResolvedAiConfig {
  vendor: ExpenseAiVendor;
  apiKey: string;
  model: string;
}

@Injectable()
export class ExpenseReceiptAiService {
  private readonly logger = new Logger(ExpenseReceiptAiService.name);
  /** Wait before the single retry when the provider names no delay. */
  retryFallbackMs = RETRY_FALLBACK_MS;

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
      throw new ServiceUnavailableException(EXPENSE_AI_ERRORS.notConfigured);
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
      throw new BadGatewayException(EXPENSE_AI_ERRORS.unusableAnswer);
    }
    return suggestion;
  }

  /**
   * Models the org's stored key can use with `provider`, for the settings
   * form. Org admins only — same rule as editing the settings. The key is
   * only ever sent to the vendor it was stored for.
   */
  async listModels(
    organizationId: string,
    user: TokenPayload,
    provider: string,
  ): Promise<ExpenseAiModelList> {
    await this.organizationSettings.assertCanManageSettings(
      organizationId,
      user,
    );
    if (!isExpenseAiProvider(provider)) {
      throw new BadRequestException('Unknown provider');
    }
    const vendor: ExpenseAiVendor =
      provider === 'contracts' ? 'mistral' : provider;
    const apiKey = await this.keyFor(organizationId, provider);
    if (!apiKey) {
      return { models: [], errorCode: EXPENSE_AI_ERRORS.notConfigured };
    }

    const request = buildExpenseAiModelsRequest(vendor, apiKey);
    let response: Response;
    try {
      response = await fetch(request.url, {
        headers: request.headers,
        signal: AbortSignal.timeout(MODELS_TIMEOUT_MS),
      });
    } catch (error) {
      const name = (error as Error).name;
      this.logger.warn(`Receipt AI models (${vendor}) not reachable: ${name}`);
      return {
        models: [],
        errorCode:
          name === 'TimeoutError' || name === 'AbortError'
            ? EXPENSE_AI_ERRORS.timeout
            : EXPENSE_AI_ERRORS.unreachable,
      };
    }
    if (!response.ok) {
      this.logger.warn(
        `Receipt AI models (${vendor}) answered ${response.status}`,
      );
      return {
        models: [],
        errorCode:
          response.status === 401 || response.status === 403
            ? EXPENSE_AI_ERRORS.keyRejected
            : EXPENSE_AI_ERRORS.failed,
      };
    }
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      return { models: [], errorCode: EXPENSE_AI_ERRORS.unusableAnswer };
    }
    return { models: parseExpenseAiModels(vendor, json), errorCode: null };
  }

  /**
   * One key slot serves all vendors, so the stored key only counts for the
   * provider it was saved with; "contracts" reads the contract AI key.
   */
  private async keyFor(
    organizationId: string,
    provider: ExpenseAiProvider,
  ): Promise<string | null> {
    if (provider === 'contracts') {
      return this.setting(organizationId, CONTRACT_AI_SETTING_KEYS.apiKey);
    }
    const stored = await this.setting(
      organizationId,
      EXPENSE_AI_SETTING_KEYS.provider,
    );
    return stored === provider
      ? this.setting(organizationId, EXPENSE_AI_SETTING_KEYS.apiKey)
      : null;
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

    // The settings form stores EXPENSE_AI_MODEL together with the provider,
    // so it always names a model of the active vendor. Until one is picked,
    // "contracts" runs on the contract model: that is the model the key is
    // known to have an allowance for, and the Mistral chat models read images.
    const model =
      (await this.setting(organizationId, EXPENSE_AI_SETTING_KEYS.model)) ??
      (provider === 'contracts'
        ? ((await this.setting(
            organizationId,
            CONTRACT_AI_SETTING_KEYS.model,
          )) ?? CONTRACT_AI_DEFAULT_MODEL)
        : EXPENSE_AI_DEFAULT_MODELS[vendor]);
    return { vendor, apiKey, model };
  }

  private async callProvider(
    config: ResolvedAiConfig,
    payload: { prompt: string; file: { base64: string; mimeType: string } },
  ): Promise<string> {
    const request = buildExpenseAiRequest({ ...config, ...payload });
    const send = async (): Promise<Response> => {
      try {
        return await fetch(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...request.headers },
          body: JSON.stringify(request.body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        const name = (error as Error).name;
        this.logger.warn(
          `Receipt AI (${config.vendor}) not reachable: ${name}`,
        );
        throw new BadGatewayException(
          name === 'TimeoutError' || name === 'AbortError'
            ? EXPENSE_AI_ERRORS.timeout
            : EXPENSE_AI_ERRORS.unreachable,
        );
      }
    };

    let response = await send();
    let failure = response.ok ? null : await this.describeFailure(response);
    // A plain request rate limit (e.g. one request per second on small tiers)
    // is gone a moment later; quota and capacity problems are not, so only
    // that one case is worth a single second attempt.
    if (failure?.code === EXPENSE_AI_ERRORS.rateLimited) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          retryDelayMs(
            response.headers.get('retry-after'),
            this.retryFallbackMs,
            MAX_RETRY_DELAY_MS,
          ),
        ),
      );
      response = await send();
      failure = response.ok ? null : await this.describeFailure(response);
    }

    if (failure) {
      // Never the full body: only the provider's type/code, plus its short
      // reason where it cannot describe the uploaded document.
      this.logger.warn(
        `Receipt AI (${config.vendor}, ${config.model}) answered ${response.status}` +
          ` → ${failure.code}` +
          (failure.info.code ? ` [${failure.info.code}]` : '') +
          (failure.logMessage ? `: ${failure.info.message}` : '') +
          rateLimitHeaders(response.headers),
      );
      throw new BadGatewayException(failure.code);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new BadGatewayException(EXPENSE_AI_ERRORS.unusableAnswer);
    }
    const text = readExpenseAiText(config.vendor, json);
    if (!text) {
      throw new BadGatewayException(EXPENSE_AI_ERRORS.unusableAnswer);
    }
    return text;
  }

  private async describeFailure(response: Response): Promise<{
    code: ExpenseAiErrorCode;
    info: ProviderErrorInfo;
    logMessage: boolean;
  }> {
    const body: unknown = await response.json().catch(() => null);
    const info = readProviderError(body);
    const code = hasZeroAllowance(response)
      ? EXPENSE_AI_ERRORS.noAllowance
      : classifyProviderError(response.status, info);
    return {
      code,
      info,
      logMessage: code !== EXPENSE_AI_ERRORS.fileRejected && !!info.message,
    };
  }
}
