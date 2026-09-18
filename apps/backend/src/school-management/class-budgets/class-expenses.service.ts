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
import { ExpenseReceiptsService } from './expense-receipts.service';

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
    private readonly receipts: ExpenseReceiptsService,
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
    const expenses = await this.expensesRepo.find({
      where,
      relations: { category: true, schoolClass: true },
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
    });
    const denial = await this.modifyDenial(organizationId, user);
    for (const expense of expenses) {
      expense.canModify = denial(expense) === null;
    }
    return expenses;
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
    const denial = await this.modifyDenial(organizationId, user);
    expense.canModify = denial(expense) === null;
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
    await this.assertReceiptUsable(
      input.receiptFileId,
      input.schoolClassId,
      organizationId,
    );

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
      // Receipts are stored per class; re-homing the file is not supported.
      if (expense.receiptFileId || input.receiptFileId) {
        throw new BadRequestException(
          'An expense with a receipt cannot be moved to another class',
        );
      }
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

    const previousReceipt = expense.receiptFileId ?? null;
    if (
      input.receiptFileId !== undefined &&
      input.receiptFileId !== previousReceipt
    ) {
      await this.assertReceiptUsable(
        input.receiptFileId,
        expense.schoolClassId,
        organizationId,
      );
    }

    const { id: _id, ...rest } = input;
    // Assign FK columns only and drop the loaded relations — saving an entity
    // whose relation object still points at the old row would silently win
    // over the changed FK column.
    delete expense.category;
    delete expense.schoolClass;
    Object.assign(expense, rest);
    await this.expensesRepo.save(expense);
    if (
      previousReceipt &&
      previousReceipt !== (expense.receiptFileId ?? null)
    ) {
      await this.receipts.deleteQuietly(
        organizationId,
        expense.schoolClassId,
        previousReceipt,
      );
    }
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
    if (expense.receiptFileId) {
      await this.receipts.deleteQuietly(
        organizationId,
        expense.schoolClassId,
        expense.receiptFileId,
      );
    }
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
    const denial = (await this.modifyDenial(organizationId, user))(expense);
    if (denial) throw new ForbiddenException(denial);
  }

  /**
   * Resolves the rule once per request so lists can flag every row
   * (`canModify`) without a query per expense.
   */
  private async modifyDenial(
    organizationId: string,
    user: TokenPayload,
  ): Promise<(expense: ClassExpense) => string | null> {
    if (this.access.canManage(user)) return () => null;

    const current = await this.access.currentSchoolYear(organizationId);
    return (expense) => {
      if (
        !user.membershipId ||
        expense.createdByMembershipId !== user.membershipId
      ) {
        return 'Only the author or a budget manager may change this expense';
      }
      if (
        expense.expenseDate < current.start ||
        expense.expenseDate > current.end
      ) {
        return 'Expenses of a closed school year can only be changed by a budget manager';
      }
      return null;
    };
  }

  /**
   * A receipt id is only accepted when the file really sits under this org
   * and class, and no other expense already points at it.
   */
  private async assertReceiptUsable(
    receiptFileId: string | null | undefined,
    schoolClassId: string,
    organizationId: string,
  ): Promise<void> {
    if (!receiptFileId) return;
    if (
      !(await this.receipts.exists(
        organizationId,
        schoolClassId,
        receiptFileId,
      ))
    ) {
      throw new BadRequestException(`Receipt ${receiptFileId} not found`);
    }
    const taken = await this.expensesRepo.exists({
      where: { organizationId, receiptFileId },
    });
    if (taken) {
      throw new BadRequestException(
        `Receipt ${receiptFileId} is already attached to an expense`,
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
