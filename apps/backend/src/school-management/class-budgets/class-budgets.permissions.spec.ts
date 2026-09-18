import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { ClassBudgetsResolver } from './class-budgets.resolver';
import { ClassExpensesResolver } from './class-expenses.resolver';
import { ExpenseCategoriesResolver } from './expense-categories.resolver';
import { ExpenseReceiptAiResolver } from './expense-receipt-ai.resolver';

type ResolverClass = { prototype: object; name: string };

/**
 * Every operation of the budget module must sit behind an authenticated,
 * permission-checked resolver. The matrix below is the contract — adding an
 * operation without listing it here fails the "no unlisted operation" test.
 */
const MATRIX: [ResolverClass, Record<string, string>][] = [
  [
    ExpenseCategoriesResolver,
    {
      findAll: 'CLASS_EXPENSE_READ',
      createExpenseCategory: 'CLASS_BUDGET_MANAGE',
      updateExpenseCategory: 'CLASS_BUDGET_MANAGE',
      archiveExpenseCategory: 'CLASS_BUDGET_MANAGE',
      reorderExpenseCategories: 'CLASS_BUDGET_MANAGE',
    },
  ],
  [
    ClassBudgetsResolver,
    {
      findAll: 'CLASS_BUDGET_MANAGE',
      summary: 'CLASS_EXPENSE_READ',
      availableSchoolYears: 'CLASS_EXPENSE_READ',
      upsertClassBudget: 'CLASS_BUDGET_MANAGE',
      copyClassBudgetsFromPreviousYear: 'CLASS_BUDGET_MANAGE',
    },
  ],
  [
    ClassExpensesResolver,
    {
      findAll: 'CLASS_EXPENSE_READ',
      findOne: 'CLASS_EXPENSE_READ',
      createClassExpense: 'CLASS_EXPENSE_WRITE',
      updateClassExpense: 'CLASS_EXPENSE_WRITE',
      deleteClassExpense: 'CLASS_EXPENSE_WRITE',
    },
  ],
  [
    ExpenseReceiptAiResolver,
    {
      isConfigured: 'CLASS_EXPENSE_READ',
      analyzeExpenseReceipt: 'CLASS_EXPENSE_WRITE',
    },
  ],
];

const methodOf = (resolver: ResolverClass, name: string): object =>
  Object.getOwnPropertyDescriptor(resolver.prototype, name)?.value as object;

describe('class budget resolvers — guards and permissions', () => {
  describe.each(MATRIX)('%p', (resolver, permissions) => {
    it('authenticates the whole resolver', () => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', resolver) ?? [];
      expect(guards).toEqual(
        expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
      );
    });

    it.each(Object.entries(permissions))(
      '%s requires %s',
      (method, permission) => {
        expect(
          Reflect.getMetadata(PERMS_KEY, methodOf(resolver, method)),
        ).toEqual([permission]);
      },
    );

    it('has no operation without a listed permission', () => {
      const operations = Object.getOwnPropertyNames(resolver.prototype).filter(
        (name) => name !== 'constructor',
      );
      expect(operations.sort()).toEqual(Object.keys(permissions).sort());
    });
  });
});
