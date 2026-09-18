import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { ExpenseReceiptSuggestion } from './dto/expense-receipt-suggestion.object';
import { ExpenseReceiptAiService } from './expense-receipt-ai.service';

@Resolver(() => ExpenseReceiptSuggestion)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ExpenseReceiptAiResolver {
  constructor(private readonly aiService: ExpenseReceiptAiService) {}

  /** Whether the "analyse with AI" button can work for the active org. */
  @Query(() => Boolean, { name: 'expenseAiConfigured' })
  @Permissions('CLASS_EXPENSE_READ')
  isConfigured(@CurrentOrgId() orgId: string) {
    return this.aiService.isConfigured(orgId);
  }

  /**
   * A mutation although nothing is stored: it sends the receipt to an
   * external provider and costs money, so it must never run as a cached or
   * prefetched query. Tightly throttled for the same reason.
   */
  @Mutation(() => ExpenseReceiptSuggestion)
  @Permissions('CLASS_EXPENSE_WRITE')
  @Throttle({ long: { ttl: 60_000, limit: 10 } })
  analyzeExpenseReceipt(
    @Args('schoolClassId', { type: () => ID }) schoolClassId: string,
    @Args('fileId') fileId: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.aiService.analyze(schoolClassId, fileId, orgId, user);
  }
}
