import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { OrganizationSettingsModule } from '@/organization-settings/organization-settings.module';
import { SchoolClassesModule } from '@/school-management/school-classes/school-classes.module';
import { ClassBudgetAccessService } from './class-budget-access.service';
import { ClassBudgetsResolver } from './class-budgets.resolver';
import { ClassBudgetsService } from './class-budgets.service';
import { ClassExpensesResolver } from './class-expenses.resolver';
import { ClassExpensesService } from './class-expenses.service';
import { ExpenseCategoriesResolver } from './expense-categories.resolver';
import { ExpenseCategoriesService } from './expense-categories.service';
import { ExpenseReceiptAiResolver } from './expense-receipt-ai.resolver';
import { ExpenseReceiptAiService } from './expense-receipt-ai.service';
import { ExpenseReceiptsController } from './expense-receipts.controller';
import { ExpenseReceiptsService } from './expense-receipts.service';

@Module({
  imports: [
    CommonModule,
    DatabaseModule,
    OrganizationSettingsModule,
    SchoolClassesModule,
  ],
  controllers: [ExpenseReceiptsController],
  providers: [
    ExpenseReceiptsService,
    ClassBudgetAccessService,
    ClassBudgetsResolver,
    ClassBudgetsService,
    ClassExpensesResolver,
    ClassExpensesService,
    ExpenseCategoriesResolver,
    ExpenseCategoriesService,
    ExpenseReceiptAiResolver,
    ExpenseReceiptAiService,
  ],
  exports: [
    ClassBudgetAccessService,
    ClassBudgetsService,
    ClassExpensesService,
    ExpenseCategoriesService,
    ExpenseReceiptsService,
  ],
})
export class ClassBudgetsModule {}
