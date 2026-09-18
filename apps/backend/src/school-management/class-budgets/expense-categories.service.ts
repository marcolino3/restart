import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { CreateExpenseCategoryInput } from './dto/create-expense-category.input';
import { UpdateExpenseCategoryInput } from './dto/update-expense-category.input';
import { ExpenseCategory } from './entities/expense-category.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @InjectRepository(ExpenseCategory)
    private readonly categoriesRepo: Repository<ExpenseCategory>,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<ExpenseCategory[]> {
    return this.categoriesRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<ExpenseCategory> {
    const category = await this.categoriesRepo.findOne({
      where: { id, organizationId },
    });
    if (!category) {
      throw new NotFoundException(`Expense category ${id} not found`);
    }
    return category;
  }

  async create(
    input: CreateExpenseCategoryInput,
    organizationId: string,
  ): Promise<ExpenseCategory> {
    let position = input.position;
    if (position === undefined) {
      const max = await this.categoriesRepo
        .createQueryBuilder('c')
        .select('MAX(c.position)', 'max')
        .where('c.organization_id = :orgId', { orgId: organizationId })
        .getRawOne<{ max: number | null }>();
      position = (max?.max ?? -1) + 1;
    }

    const category = this.categoriesRepo.create({
      ...input,
      position,
      organizationId,
    });
    return this.saveUnique(category);
  }

  async update(
    input: UpdateExpenseCategoryInput,
    organizationId: string,
  ): Promise<ExpenseCategory> {
    const category = await this.findOne(input.id, organizationId);
    const { id: _id, ...rest } = input;
    Object.assign(category, rest);
    return this.saveUnique(category);
  }

  /**
   * Categories are archived, never deleted: expenses of past school years
   * keep pointing at them (FK is RESTRICT) and the breakdown stays intact.
   */
  async archive(id: string, organizationId: string): Promise<boolean> {
    const category = await this.findOne(id, organizationId);
    category.isArchived = true;
    await this.categoriesRepo.save(category);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<ExpenseCategory[]> {
    const categories = await this.categoriesRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (categories.length !== ids.length) {
      throw new NotFoundException(
        'One or more expense categories not found for this organization',
      );
    }
    const byId = new Map(categories.map((c) => [c.id, c]));
    const toSave = ids.map((id, index) => {
      const category = byId.get(id)!;
      category.position = index;
      return category;
    });
    await this.categoriesRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }

  private async saveUnique(
    category: ExpenseCategory,
  ): Promise<ExpenseCategory> {
    try {
      return await this.categoriesRepo.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `Expense category "${category.name}" already exists`,
        );
      }
      throw error;
    }
  }
}
