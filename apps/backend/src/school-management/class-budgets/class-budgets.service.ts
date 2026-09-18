import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import {
  SchoolYearRange,
  schoolYearFor,
} from '@/school-management/school-classes/lib/school-year';
import { Organization } from '@/organizations/entities/organization.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClassBudgetAccessService } from './class-budget-access.service';
import {
  ClassBudgetCategoryTotal,
  ClassBudgetSummary,
} from './dto/class-budget-summary.object';
import { UpsertClassBudgetInput } from './dto/upsert-class-budget.input';
import { ClassBudget } from './entities/class-budget.entity';
import { ClassExpense } from './entities/class-expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { fromMinorUnits, toMinorUnits } from './lib/money';

const DEFAULT_CURRENCY = 'CHF';

@Injectable()
export class ClassBudgetsService {
  constructor(
    @InjectRepository(ClassBudget)
    private readonly budgetsRepo: Repository<ClassBudget>,
    @InjectRepository(ClassExpense)
    private readonly expensesRepo: Repository<ClassExpense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoriesRepo: Repository<ExpenseCategory>,
    @InjectRepository(SchoolClass)
    private readonly schoolClassRepo: Repository<SchoolClass>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    private readonly access: ClassBudgetAccessService,
  ) {}

  /** All budgets of the org for one school year (manager view). */
  findAllByOrgId(
    organizationId: string,
    schoolYearStart: number,
  ): Promise<ClassBudget[]> {
    return this.budgetsRepo.find({
      where: { organizationId, schoolYearStart },
      relations: { schoolClass: true },
    });
  }

  async upsert(
    input: UpsertClassBudgetInput,
    organizationId: string,
  ): Promise<ClassBudget> {
    // The class id comes from the client — it must belong to the active org.
    const schoolClass = await this.schoolClassRepo.findOne({
      where: { id: input.schoolClassId, organizationId },
      select: { id: true },
    });
    if (!schoolClass) {
      throw new NotFoundException(
        `School class ${input.schoolClassId} not found`,
      );
    }

    const existing = await this.budgetsRepo.findOne({
      where: {
        organizationId,
        schoolClassId: input.schoolClassId,
        schoolYearStart: input.schoolYearStart,
      },
    });
    const budget =
      existing ??
      this.budgetsRepo.create({
        organizationId,
        schoolClassId: input.schoolClassId,
        schoolYearStart: input.schoolYearStart,
        currency: DEFAULT_CURRENCY,
      });
    budget.amount = input.amount;
    budget.note = input.note ?? null;
    return this.budgetsRepo.save(budget);
  }

  /**
   * Copies last year's amounts into `schoolYearStart` for every class that has
   * no budget there yet. Existing budgets are never overwritten.
   */
  async copyFromPreviousYear(
    organizationId: string,
    schoolYearStart: number,
  ): Promise<ClassBudget[]> {
    const [previous, current] = await Promise.all([
      this.budgetsRepo.find({
        where: { organizationId, schoolYearStart: schoolYearStart - 1 },
      }),
      this.budgetsRepo.find({ where: { organizationId, schoolYearStart } }),
    ]);
    const taken = new Set(current.map((budget) => budget.schoolClassId));
    const candidates = previous.filter(
      (budget) => !taken.has(budget.schoolClassId),
    );
    if (candidates.length > 0) {
      // Skip classes that were deactivated in the meantime.
      const active = await this.schoolClassRepo.find({
        where: {
          id: In(candidates.map((budget) => budget.schoolClassId)),
          organizationId,
          isActive: true,
        },
        select: { id: true },
      });
      const activeIds = new Set(active.map((schoolClass) => schoolClass.id));
      await this.budgetsRepo.save(
        candidates
          .filter((budget) => activeIds.has(budget.schoolClassId))
          .map((budget) =>
            this.budgetsRepo.create({
              organizationId,
              schoolClassId: budget.schoolClassId,
              schoolYearStart,
              amount: budget.amount,
              currency: budget.currency,
            }),
          ),
      );
    }
    return this.findAllByOrgId(organizationId, schoolYearStart);
  }

  async summary(
    schoolClassId: string,
    schoolYearStart: number,
    organizationId: string,
    user: TokenPayload,
  ): Promise<ClassBudgetSummary> {
    await this.access.assertSchoolClassAccessible(
      schoolClassId,
      organizationId,
      user,
    );
    const schoolYear = await this.access.schoolYearStarting(
      organizationId,
      schoolYearStart,
    );

    const [budget, totals] = await Promise.all([
      this.budgetsRepo.findOne({
        where: { organizationId, schoolClassId, schoolYearStart },
      }),
      this.expensesRepo
        .createQueryBuilder('e')
        .select('e.category_id', 'categoryId')
        .addSelect('SUM(e.amount)', 'total')
        .where('e.organization_id = :organizationId', { organizationId })
        .andWhere('e.school_class_id = :schoolClassId', { schoolClassId })
        .andWhere('e.expense_date BETWEEN :start AND :end', {
          start: schoolYear.start,
          end: schoolYear.end,
        })
        .groupBy('e.category_id')
        .getRawMany<{ categoryId: string; total: string }>(),
    ]);

    const categories = totals.length
      ? await this.categoriesRepo.find({
          where: {
            id: In(totals.map((row) => row.categoryId)),
            organizationId,
          },
        })
      : [];
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    const byCategory: ClassBudgetCategoryTotal[] = totals
      .filter((row) => categoryById.has(row.categoryId))
      .map((row) => ({
        category: categoryById.get(row.categoryId)!,
        total: fromMinorUnits(toMinorUnits(row.total)),
      }))
      .sort((a, b) => a.category.position - b.category.position);

    const spentMinor = totals.reduce(
      (sum, row) => sum + toMinorUnits(row.total),
      0,
    );
    const budgetMinor = budget ? toMinorUnits(budget.amount) : null;

    return {
      schoolClassId,
      schoolYear,
      budget: budgetMinor === null ? null : fromMinorUnits(budgetMinor),
      spent: fromMinorUnits(spentMinor),
      remaining: fromMinorUnits((budgetMinor ?? 0) - spentMinor),
      isOverBudget: budgetMinor !== null && spentMinor > budgetMinor,
      currency: budget?.currency ?? DEFAULT_CURRENCY,
      byCategory,
    };
  }

  /**
   * School years the caller can browse: every year that has a budget or an
   * expense in one of their visible classes, plus the current one. Newest
   * first.
   */
  async availableSchoolYears(
    organizationId: string,
    user: TokenPayload,
  ): Promise<SchoolYearRange[]> {
    const current = await this.access.currentSchoolYear(organizationId);
    const classIds = await this.access.visibleSchoolClassIds(
      organizationId,
      user,
    );
    const startYears = new Set<number>([current.startYear]);

    if (classIds.length > 0) {
      const org = await this.organizationRepo.findOneOrFail({
        where: { id: organizationId },
        select: {
          id: true,
          schoolYearStartMonth: true,
          schoolYearStartDay: true,
        },
      });
      const [budgetYears, expenseSpan] = await Promise.all([
        this.budgetsRepo
          .createQueryBuilder('b')
          .select('DISTINCT b.school_year_start', 'year')
          .where('b.organization_id = :organizationId', { organizationId })
          .andWhere('b.school_class_id IN (:...classIds)', { classIds })
          .getRawMany<{ year: number }>(),
        this.expensesRepo
          .createQueryBuilder('e')
          .select("to_char(MIN(e.expense_date), 'YYYY-MM-DD')", 'min')
          .addSelect("to_char(MAX(e.expense_date), 'YYYY-MM-DD')", 'max')
          .where('e.organization_id = :organizationId', { organizationId })
          .andWhere('e.school_class_id IN (:...classIds)', { classIds })
          .getRawOne<{ min: string | null; max: string | null }>(),
      ]);
      budgetYears.forEach((row) => startYears.add(Number(row.year)));
      if (expenseSpan?.min && expenseSpan.max) {
        const first = schoolYearFor(expenseSpan.min, org).startYear;
        const last = schoolYearFor(expenseSpan.max, org).startYear;
        for (let year = first; year <= last; year += 1) startYears.add(year);
      }
    }

    return Promise.all(
      [...startYears]
        .sort((a, b) => b - a)
        .map((year) => this.access.schoolYearStarting(organizationId, year)),
    );
  }
}
