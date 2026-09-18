import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { SchoolClassesModule } from '@/school-management/school-classes/school-classes.module';
import { ClassBudgetAccessService } from './class-budget-access.service';
import { ClassBudgetsResolver } from './class-budgets.resolver';
import { ClassBudgetsService } from './class-budgets.service';
import { ClassExpensesResolver } from './class-expenses.resolver';
import { ClassExpensesService } from './class-expenses.service';
import { ExpenseCategoriesResolver } from './expense-categories.resolver';
import { ExpenseCategoriesService } from './expense-categories.service';

@Module({
  imports: [CommonModule, DatabaseModule, SchoolClassesModule],
  providers: [
    ClassBudgetAccessService,
    ClassBudgetsResolver,
    ClassBudgetsService,
    ClassExpensesResolver,
    ClassExpensesService,
    ExpenseCategoriesResolver,
    ExpenseCategoriesService,
  ],
  exports: [
    ClassBudgetAccessService,
    ClassBudgetsService,
    ClassExpensesService,
    ExpenseCategoriesService,
  ],
})
export class ClassBudgetsModule {}
