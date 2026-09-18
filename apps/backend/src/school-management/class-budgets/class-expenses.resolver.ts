import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { ClassExpensesService } from './class-expenses.service';
import { ClassExpense } from './entities/class-expense.entity';
import { CreateClassExpenseInput } from './dto/create-class-expense.input';
import { UpdateClassExpenseInput } from './dto/update-class-expense.input';

@Resolver(() => ClassExpense)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ClassExpensesResolver {
  constructor(private readonly expensesService: ClassExpensesService) {}

  /**
   * Expenses of one school year. Without `schoolClassId` the result spans
   * every class the caller may see (all for managers, own for teachers).
   */
  @Query(() => [ClassExpense], { name: 'classExpenses' })
  @Permissions('CLASS_EXPENSE_READ')
  findAll(
    @Args('schoolYearStart', { type: () => Int }) schoolYearStart: number,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
    @Args('schoolClassId', { type: () => ID, nullable: true })
    schoolClassId?: string,
    @Args('categoryId', { type: () => ID, nullable: true })
    categoryId?: string,
  ) {
    return this.expensesService.findAll(
      { schoolYearStart, schoolClassId, categoryId },
      orgId,
      user,
    );
  }

  @Query(() => ClassExpense, { name: 'classExpenseById' })
  @Permissions('CLASS_EXPENSE_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.expensesService.findOne(id, orgId, user);
  }

  @Mutation(() => ClassExpense)
  @Permissions('CLASS_EXPENSE_WRITE')
  createClassExpense(
    @Args('input') input: CreateClassExpenseInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.expensesService.create(input, orgId, user);
  }

  @Mutation(() => ClassExpense)
  @Permissions('CLASS_EXPENSE_WRITE')
  updateClassExpense(
    @Args('input') input: UpdateClassExpenseInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.expensesService.update(input, orgId, user);
  }

  @Mutation(() => ClassExpense)
  @Permissions('CLASS_EXPENSE_WRITE')
  deleteClassExpense(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.expensesService.remove(id, orgId, user);
  }
}
