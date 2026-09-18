import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, Repository } from 'typeorm';
import { ClassBudgetAccessService } from './class-budget-access.service';
import { CreateClassExpenseInput } from './dto/create-class-expense.input';
import { UpdateClassExpenseInput } from './dto/update-class-expense.input';
import { ClassExpense } from './entities/class-expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';

export interface ClassExpenseFilter {
  schoolYearStart: number;
  schoolClassId?: string | null;
  categoryId?: string | null;
}

@Injectable()
export class ClassExpensesService {
  constructor(
    @InjectRepository(ClassExpense)
    private readonly expensesRepo: Repository<ClassExpense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoriesRepo: Repository<ExpenseCategory>,
    private readonly access: ClassBudgetAccessService,
  ) {}

  async findAll(
    filter: ClassExpenseFilter,
    organizationId: string,
    user: TokenPayload,
  ): Promise<ClassExpense[]> {
    let classIds = await this.access.visibleSchoolClassIds(
      organizationId,
      user,
    );
    if (filter.schoolClassId) {
      if (!classIds.includes(filter.schoolClassId)) {
        throw new NotFoundException(
          `School class ${filter.schoolClassId} not found`,
        );
      }
      classIds = [filter.schoolClassId];
    }
    if (classIds.length === 0) return [];

    const schoolYear = await this.access.schoolYearStarting(
      organizationId,
      filter.schoolYearStart,
    );
    const where: FindOptionsWhere<ClassExpense> = {
      organizationId,
      schoolClassId: In(classIds),
      expenseDate: Between(schoolYear.start, schoolYear.end),
      ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    };
    return this.expensesRepo.find({
      where,
      relations: { category: true, schoolClass: true },
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
    user: TokenPayload,
  ): Promise<ClassExpense> {
    const expense = await this.expensesRepo.findOne({
      where: { id, organizationId },
      relations: { category: true, schoolClass: true },
    });
    if (!expense) {
      throw new NotFoundException(`Class expense ${id} not found`);
    }
    await this.access.assertSchoolClassAccessible(
      expense.schoolClassId,
      organizationId,
      user,
    );
    return expense;
  }

  async create(
    input: CreateClassExpenseInput,
    organizationId: string,
    user: TokenPayload,
  ): Promise<ClassExpense> {
    await this.access.assertSchoolClassAccessible(
      input.schoolClassId,
      organizationId,
      user,
    );
    await this.assertCategoryUsable(input.categoryId, organizationId);

    const expense = this.expensesRepo.create({
      ...input,
      organizationId,
      createdByMembershipId: user.membershipId ?? null,
    });
    const saved = await this.expensesRepo.save(expense);
    return this.findOne(saved.id, organizationId, user);
  }

  async update(
    input: UpdateClassExpenseInput,
    organizationId: string,
    user: TokenPayload,
  ): Promise<ClassExpense> {
    const expense = await this.findOne(input.id, organizationId, user);
    await this.assertMayModify(expense, organizationId, user);

    if (
      input.schoolClassId !== undefined &&
      input.schoolClassId !== expense.schoolClassId
    ) {
      await this.access.assertSchoolClassAccessible(
        input.schoolClassId,
        organizationId,
        user,
      );
    }
    if (
      input.categoryId !== undefined &&
      input.categoryId !== expense.categoryId
    ) {
      await this.assertCategoryUsable(input.categoryId, organizationId);
    }

    const { id: _id, ...rest } = input;
    // Assign FK columns only and drop the loaded relations — saving an entity
    // whose relation object still points at the old row would silently win
    // over the changed FK column.
    delete expense.category;
    delete expense.schoolClass;
    Object.assign(expense, rest);
    await this.expensesRepo.save(expense);
    return this.findOne(expense.id, organizationId, user);
  }

  async remove(
    id: string,
    organizationId: string,
    user: TokenPayload,
  ): Promise<ClassExpense> {
    const expense = await this.findOne(id, organizationId, user);
    await this.assertMayModify(expense, organizationId, user);
    await this.expensesRepo.delete({ id: expense.id, organizationId });
    return expense;
  }

  /**
   * Managers may change anything. Teachers only their own entries, and only
   * while the entry's school year is still running — closed years are the
   * admin's record.
   */
  private async assertMayModify(
    expense: ClassExpense,
    organizationId: string,
    user: TokenPayload,
  ): Promise<void> {
    if (this.access.canManage(user)) return;

    if (
      !user.membershipId ||
      expense.createdByMembershipId !== user.membershipId
    ) {
      throw new ForbiddenException(
        'Only the author or a budget manager may change this expense',
      );
    }
    const current = await this.access.currentSchoolYear(organizationId);
    if (
      expense.expenseDate < current.start ||
      expense.expenseDate > current.end
    ) {
      throw new ForbiddenException(
        'Expenses of a closed school year can only be changed by a budget manager',
      );
    }
  }

  private async assertCategoryUsable(
    categoryId: string,
    organizationId: string,
  ): Promise<void> {
    const category = await this.categoriesRepo.findOne({
      where: { id: categoryId, organizationId },
      select: { id: true, isArchived: true },
    });
    if (!category) {
      throw new NotFoundException(`Expense category ${categoryId} not found`);
    }
    if (category.isArchived) {
      throw new BadRequestException(
        `Expense category ${categoryId} is archived`,
      );
    }
  }
}
