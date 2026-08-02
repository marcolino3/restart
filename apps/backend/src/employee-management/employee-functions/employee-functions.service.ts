import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { Locale } from '@/database/enums/locale.enum';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { EmployeeFunction } from './entities/employee-function.entity';
import { EmployeeFunctionTranslation } from './entities/employee-function-translation.entity';
import { CreateEmployeeFunctionInput } from './dto/create-employee-function.input';
import { UpdateEmployeeFunctionInput } from './dto/update-employee-function.input';
import { EmployeeFunctionTranslationInput } from './dto/employee-function-translation.input';
import { seedOrgEmployeeFunctions } from './seeds/seed-org-employee-functions.seeder';

/** Preferred order for the canonical `name` column (legacy + uniqueness). */
const CANONICAL_LOCALE_ORDER: Locale[] = [
  Locale.DE,
  Locale.EN,
  Locale.FR,
  Locale.IT,
];

@Injectable()
export class EmployeeFunctionsService {
  constructor(
    @InjectRepository(EmployeeFunction)
    private readonly functionsRepo: Repository<EmployeeFunction>,
    @InjectRepository(EmployeeFunctionTranslation)
    private readonly translationsRepo: Repository<EmployeeFunctionTranslation>,
    @InjectRepository(EmployeeContract)
    private readonly contractsRepo: Repository<EmployeeContract>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllByOrgId(
    organizationId: string,
    includeArchived = false,
  ): Promise<EmployeeFunction[]> {
    const functions = await this.functionsRepo.find({
      where: {
        organizationId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      relations: ['translations'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    await this.attachUsageCounts(functions, organizationId);
    return functions;
  }

  async findOne(id: string, organizationId: string): Promise<EmployeeFunction> {
    const fn = await this.functionsRepo.findOne({
      where: { id, organizationId },
      relations: ['translations'],
    });
    if (!fn) {
      throw new NotFoundException(`Employee function ${id} not found`);
    }
    fn.usageCount = await this.countUsages(fn, organizationId);
    return fn;
  }

  async create(
    input: CreateEmployeeFunctionInput,
    organizationId: string,
  ): Promise<EmployeeFunction> {
    this.assertUniqueLocales(input.translations.map((t) => t.locale));
    const canonicalName = this.resolveCanonicalName(input.translations);
    await this.assertUniqueCanonicalName(canonicalName, organizationId);

    return this.dataSource.transaction(async (m) => {
      let sortOrder = input.sortOrder;
      if (sortOrder === undefined) {
        const max = await m
          .getRepository(EmployeeFunction)
          .createQueryBuilder('f')
          .select('MAX(f.sort_order)', 'max')
          .where('f.organization_id = :orgId', { orgId: organizationId })
          .getRawOne<{ max: number | null }>();
        sortOrder = (max?.max ?? -1) + 1;
      }

      const fn = await m.getRepository(EmployeeFunction).save(
        m.getRepository(EmployeeFunction).create({
          name: canonicalName,
          sortOrder,
          organizationId,
        }),
      );

      await this.saveTranslations(m, fn.id, input.translations);
      return this.findOneInTransaction(m, fn.id, organizationId);
    });
  }

  async update(
    input: UpdateEmployeeFunctionInput,
    organizationId: string,
  ): Promise<EmployeeFunction> {
    const existing = await this.findOne(input.id, organizationId);

    if (input.translations?.length) {
      this.assertUniqueLocales(input.translations.map((t) => t.locale));
      const canonicalName = this.resolveCanonicalName(input.translations);
      if (canonicalName !== existing.name) {
        await this.assertUniqueCanonicalName(
          canonicalName,
          organizationId,
          existing.id,
        );
      }
    }

    return this.dataSource.transaction(async (m) => {
      if (input.translations?.length) {
        const canonicalName = this.resolveCanonicalName(input.translations);
        existing.name = canonicalName;
        await m.getRepository(EmployeeFunction).save(existing);
        await this.saveTranslations(m, existing.id, input.translations);
      }

      return this.findOneInTransaction(m, existing.id, organizationId);
    });
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const fn = await this.findOne(id, organizationId);
    fn.isArchived = true;
    await this.functionsRepo.save(fn);
    return true;
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const fn = await this.findOne(id, organizationId);
    const usageCount = await this.countUsages(fn, organizationId);
    if (usageCount > 0) {
      throw new ConflictException(
        `Cannot delete function: ${usageCount} employee(s) still assigned`,
      );
    }
    await this.functionsRepo.remove(fn);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<EmployeeFunction[]> {
    const functions = await this.functionsRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (functions.length !== ids.length) {
      throw new NotFoundException(
        'One or more employee functions not found for this organization',
      );
    }
    const byId = new Map(functions.map((f) => [f.id, f]));
    const toSave = ids.map((id, index) => {
      const fn = byId.get(id)!;
      fn.sortOrder = index;
      return fn;
    });
    await this.functionsRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }

  async seedDefaultsForOrg(organizationId: string): Promise<void> {
    await seedOrgEmployeeFunctions(this.functionsRepo.manager, organizationId);
  }

  private async attachUsageCounts(
    functions: EmployeeFunction[],
    organizationId: string,
  ): Promise<void> {
    await Promise.all(
      functions.map(async (fn) => {
        fn.usageCount = await this.countUsages(fn, organizationId);
      }),
    );
  }

  /** Distinct employees with any contract referencing this function (incl. inactive). */
  async countUsages(
    fn: EmployeeFunction,
    organizationId: string,
  ): Promise<number> {
    const values = this.positionMatchValues(fn);
    if (!values.length) return 0;

    const qb = this.contractsRepo
      .createQueryBuilder('c')
      .select('COUNT(DISTINCT c.employee_id)', 'cnt')
      .where('c.organization_id = :organizationId', { organizationId })
      .andWhere('c.position IS NOT NULL');

    qb.andWhere(
      new Brackets((sub) => {
        values.forEach((val, i) => {
          const param = `pos${i}`;
          const condition =
            val === fn.id
              ? `c.position = :${param}`
              : `LOWER(c.position) = LOWER(:${param})`;
          if (i === 0) {
            sub.where(condition, { [param]: val });
          } else {
            sub.orWhere(condition, { [param]: val });
          }
        });
      }),
    );

    const row = await qb.getRawOne<{ cnt: string }>();
    return Number(row?.cnt ?? 0);
  }

  private positionMatchValues(fn: EmployeeFunction): string[] {
    const values = new Set<string>();
    values.add(fn.id);
    values.add(fn.name);
    for (const t of fn.translations ?? []) {
      const trimmed = t.name?.trim();
      if (trimmed) values.add(trimmed);
    }
    return [...values];
  }

  private async findOneInTransaction(
    m: DataSource['manager'],
    id: string,
    organizationId: string,
  ): Promise<EmployeeFunction> {
    const fn = await m.getRepository(EmployeeFunction).findOne({
      where: { id, organizationId },
      relations: ['translations'],
    });
    if (!fn) {
      throw new NotFoundException(`Employee function ${id} not found`);
    }
    fn.usageCount = await this.countUsages(fn, organizationId);
    return fn;
  }

  private async saveTranslations(
    m: DataSource['manager'],
    functionId: string,
    translations: EmployeeFunctionTranslationInput[],
  ): Promise<void> {
    const repo = m.getRepository(EmployeeFunctionTranslation);
    for (const t of translations) {
      const trimmed = t.name.trim();
      if (!trimmed) {
        await repo.delete({ functionId, locale: t.locale });
        continue;
      }
      await repo.upsert(
        { functionId, locale: t.locale, name: trimmed },
        ['functionId', 'locale'],
      );
    }
  }

  private resolveCanonicalName(
    translations: EmployeeFunctionTranslationInput[],
  ): string {
    this.assertAtLeastOneTranslation(translations);

    const byLocale = new Map(
      translations.map((t) => [t.locale, t.name.trim()] as const),
    );

    for (const locale of CANONICAL_LOCALE_ORDER) {
      const name = byLocale.get(locale);
      if (name) return name;
    }

    throw new BadRequestException('At least one translation is required');
  }

  private assertAtLeastOneTranslation(
    translations: EmployeeFunctionTranslationInput[],
  ): void {
    const hasAny = translations.some((t) => t.name?.trim());
    if (!hasAny) {
      throw new BadRequestException('At least one translation is required');
    }
  }

  private async assertUniqueCanonicalName(
    name: string,
    organizationId: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.functionsRepo
      .createQueryBuilder('f')
      .where('f.organization_id = :organizationId', { organizationId })
      .andWhere('LOWER(f.name) = LOWER(:name)', { name })
      .andWhere('f.isArchived = false');
    if (excludeId) {
      qb.andWhere('f.id != :excludeId', { excludeId });
    }
    const conflict = await qb.getOne();
    if (conflict) {
      throw new ConflictException(
        `An employee function named "${name}" already exists`,
      );
    }
  }

  private assertUniqueLocales(locales: Locale[]): void {
    if (new Set(locales).size !== locales.length) {
      throw new BadRequestException('Duplicate locales in translations');
    }
  }
}
