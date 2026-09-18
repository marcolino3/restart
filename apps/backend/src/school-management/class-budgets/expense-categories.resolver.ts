import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { ExpenseCategoriesService } from './expense-categories.service';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CreateExpenseCategoryInput } from './dto/create-expense-category.input';
import { UpdateExpenseCategoryInput } from './dto/update-expense-category.input';
import { ReorderExpenseCategoriesInput } from './dto/reorder-expense-categories.input';

@Resolver(() => ExpenseCategory)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ExpenseCategoriesResolver {
  constructor(private readonly categoriesService: ExpenseCategoriesService) {}

  @Query(() => [ExpenseCategory], { name: 'expenseCategories' })
  @Permissions('CLASS_EXPENSE_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.categoriesService.findAllByOrgId(
      orgId,
      includeArchived ?? false,
    );
  }

  @Mutation(() => ExpenseCategory)
  @Permissions('CLASS_BUDGET_MANAGE')
  createExpenseCategory(
    @Args('input') input: CreateExpenseCategoryInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.create(input, orgId);
  }

  @Mutation(() => ExpenseCategory)
  @Permissions('CLASS_BUDGET_MANAGE')
  updateExpenseCategory(
    @Args('input') input: UpdateExpenseCategoryInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('CLASS_BUDGET_MANAGE')
  archiveExpenseCategory(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.archive(id, orgId);
  }

  @Mutation(() => [ExpenseCategory])
  @Permissions('CLASS_BUDGET_MANAGE')
  reorderExpenseCategories(
    @Args('input') input: ReorderExpenseCategoriesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.reorder(input.ids, orgId);
  }
}
