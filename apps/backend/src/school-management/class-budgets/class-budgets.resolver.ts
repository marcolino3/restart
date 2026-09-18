import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SchoolYear } from '@/school-management/school-classes/dto/school-year.object';
import { ClassBudgetsService } from './class-budgets.service';
import { ClassBudget } from './entities/class-budget.entity';
import { ClassBudgetSummary } from './dto/class-budget-summary.object';
import { UpsertClassBudgetInput } from './dto/upsert-class-budget.input';

@Resolver(() => ClassBudget)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ClassBudgetsResolver {
  constructor(private readonly budgetsService: ClassBudgetsService) {}

  /** Manager overview: budgets of every class in one school year. */
  @Query(() => [ClassBudget], { name: 'classBudgets' })
  @Permissions('CLASS_BUDGET_MANAGE')
  findAll(
    @Args('schoolYearStart', { type: () => Int }) schoolYearStart: number,
    @CurrentOrgId() orgId: string,
  ) {
    return this.budgetsService.findAllByOrgId(orgId, schoolYearStart);
  }

  @Query(() => ClassBudgetSummary, { name: 'classBudgetSummary' })
  @Permissions('CLASS_EXPENSE_READ')
  summary(
    @Args('schoolClassId', { type: () => ID }) schoolClassId: string,
    @Args('schoolYearStart', { type: () => Int }) schoolYearStart: number,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.budgetsService.summary(
      schoolClassId,
      schoolYearStart,
      orgId,
      user,
    );
  }

  @Query(() => [SchoolYear], { name: 'classBudgetSchoolYears' })
  @Permissions('CLASS_EXPENSE_READ')
  availableSchoolYears(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.budgetsService.availableSchoolYears(orgId, user);
  }

  @Mutation(() => ClassBudget)
  @Permissions('CLASS_BUDGET_MANAGE')
  upsertClassBudget(
    @Args('input') input: UpsertClassBudgetInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.budgetsService.upsert(input, orgId);
  }

  @Mutation(() => [ClassBudget])
  @Permissions('CLASS_BUDGET_MANAGE')
  copyClassBudgetsFromPreviousYear(
    @Args('schoolYearStart', { type: () => Int }) schoolYearStart: number,
    @CurrentOrgId() orgId: string,
  ) {
    return this.budgetsService.copyFromPreviousYear(orgId, schoolYearStart);
  }
}
