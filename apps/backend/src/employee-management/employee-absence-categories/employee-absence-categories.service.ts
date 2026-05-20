import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { CreateEmployeeAbsenceCategoryInput } from './dto/create-employee-absence-category.input';
import { UpdateEmployeeAbsenceCategoryInput } from './dto/update-employee-absence-category.input';
import { UpsertEmployeeAbsenceCategoryTranslationInput } from './dto/upsert-employee-absence-category-translation.input';
import { EmployeeAbsenceCategoryTranslation } from './entities/employee-absence-category-translation.entity';
import { EmployeeAbsenceCategory } from './entities/employee-absence-category.entity';
import { seedOrgEmployeeAbsenceCategories } from './seeds/seed-org-employee-absence-categories.seeder';
import { SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES } from './seeds/system-employee-absence-categories';

@Injectable()
export class EmployeeAbsenceCategoriesService {
  constructor(
    @InjectRepository(EmployeeAbsenceCategory)
    private readonly categoriesRepo: Repository<EmployeeAbsenceCategory>,
    @InjectRepository(EmployeeAbsenceCategoryTranslation)
    private readonly translationsRepo: Repository<EmployeeAbsenceCategoryTranslation>,
    private readonly dataSource: DataSource,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Setzt die System-Kategorien-Translations einer Org auf die aktuellen
   * Defaults zurueck (DE/FR/IT/EN). Nur Kategorien mit isSystem=true werden
   * angefasst — Custom-Kategorien und deren Translations bleiben unveraendert.
   *
   * Anwendungsfall: Wenn Defaults im Code geschaerft wurden (Akzente,
   * Schweizer HR-Begriffe), sollen bestehende Orgs die neue Schreibweise
   * uebernehmen. Achtung: Falls eine Org den System-Namen bewusst
   * angepasst hat (z.B. "Krankheit" → "Krank/Unwohl"), wird das ueberschrieben.
   */
  async resyncSystemTranslations(organizationId: string): Promise<{
    updatedCategories: number;
    upsertedTranslations: number;
  }> {
    const systemCodes = SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES.map((d) => d.code);
    const categories = await this.categoriesRepo.find({
      where: {
        organizationId,
        isSystem: true,
        systemCode: In(systemCodes),
      },
      select: ['id', 'systemCode'],
    });
    if (categories.length === 0) {
      return { updatedCategories: 0, upsertedTranslations: 0 };
    }

    const byCode = new Map(categories.map((c) => [c.systemCode!, c.id]));

    let upserted = 0;
    await this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(EmployeeAbsenceCategoryTranslation);
      for (const def of SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES) {
        const categoryId = byCode.get(def.code);
        if (!categoryId) continue;
        for (const [locale, t] of Object.entries(def.translations)) {
          await repo.upsert(
            {
              categoryId,
              locale: locale as keyof typeof def.translations,
              name: t.name,
              description: t.description ?? null,
            },
            ['categoryId', 'locale'],
          );
          upserted++;
        }
      }
    });

    return {
      updatedCategories: categories.length,
      upsertedTranslations: upserted,
    };
  }

  async seedOrgEmployeeAbsenceCategories(orgId: string) {
    await this.entityManager.transaction(async (manager) => {
      await seedOrgEmployeeAbsenceCategories(manager, orgId);
      return true;
    });
  }

  async findEmployeeAbsenceCategoriesByOrgId(organizationId: string) {
    return this.categoriesRepo.find({
      where: { organizationId, isArchived: false },
      relations: ['translations'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<EmployeeAbsenceCategory> {
    const category = await this.categoriesRepo.findOne({
      where: { id, organizationId },
      relations: ['translations'],
    });
    if (!category) {
      throw new NotFoundException(`Employee absence category ${id} not found`);
    }
    return category;
  }

  async create(
    input: CreateEmployeeAbsenceCategoryInput,
    organizationId: string,
  ): Promise<EmployeeAbsenceCategory> {
    this.assertUniqueLocales(input.translations.map((t) => t.locale));

    return this.dataSource.transaction(async (m) => {
      // Neue Kategorien landen am Ende der Liste
      const maxRow = await m
        .getRepository(EmployeeAbsenceCategory)
        .createQueryBuilder('c')
        .select('MAX(c.sort_order)', 'max')
        .where('c.organization_id = :organizationId', { organizationId })
        .getRawOne<{ max: number | null }>();
      const nextSortOrder = (maxRow?.max ?? -1) + 1;

      const category = m.getRepository(EmployeeAbsenceCategory).create({
        organizationId,
        systemCode: null,
        isSystem: false,
        countsAsWorkTime: input.countsAsWorkTime ?? true,
        isPaid: input.isPaid ?? true,
        affectsVacationBalance: input.affectsVacationBalance ?? false,
        defaultIsVacationCapable: input.defaultIsVacationCapable ?? true,
        reducesVacationEntitlementAfterDays:
          input.reducesVacationEntitlementAfterDays ?? null,
        requiresCertificate: input.requiresCertificate ?? false,
        certificateRequiredFromDay: input.certificateRequiredFromDay ?? null,
        maxDaysPerYear: input.maxDaysPerYear ?? null,
        defaultPercentage: input.defaultPercentage ?? 100,
        requiresApproval: input.requiresApproval ?? false,
        color: input.color ?? null,
        iconName: input.iconName ?? null,
        sortOrder: input.sortOrder ?? nextSortOrder,
      });
      const saved = await m
        .getRepository(EmployeeAbsenceCategory)
        .save(category);

      const translations = input.translations.map((t) =>
        m.getRepository(EmployeeAbsenceCategoryTranslation).create({
          categoryId: saved.id,
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
        }),
      );
      await m
        .getRepository(EmployeeAbsenceCategoryTranslation)
        .save(translations);

      const reloaded = await m
        .getRepository(EmployeeAbsenceCategory)
        .findOne({ where: { id: saved.id }, relations: ['translations'] });
      return reloaded!;
    });
  }

  async update(
    input: UpdateEmployeeAbsenceCategoryInput,
    organizationId: string,
  ): Promise<EmployeeAbsenceCategory> {
    const category = await this.findOne(input.id, organizationId);

    // System-Kategorien: nur Translations + UI-Felder editierbar, Verhalten gelockt
    const assignBehavior = !category.isSystem;

    if (assignBehavior) {
      if (input.countsAsWorkTime !== undefined)
        category.countsAsWorkTime = input.countsAsWorkTime;
      if (input.isPaid !== undefined) category.isPaid = input.isPaid;
      if (input.affectsVacationBalance !== undefined)
        category.affectsVacationBalance = input.affectsVacationBalance;
      if (input.defaultIsVacationCapable !== undefined)
        category.defaultIsVacationCapable = input.defaultIsVacationCapable;
      if (input.reducesVacationEntitlementAfterDays !== undefined)
        category.reducesVacationEntitlementAfterDays =
          input.reducesVacationEntitlementAfterDays;
      if (input.requiresCertificate !== undefined)
        category.requiresCertificate = input.requiresCertificate;
      if (input.certificateRequiredFromDay !== undefined)
        category.certificateRequiredFromDay = input.certificateRequiredFromDay;
      if (input.maxDaysPerYear !== undefined)
        category.maxDaysPerYear = input.maxDaysPerYear;
      if (input.defaultPercentage !== undefined)
        category.defaultPercentage = input.defaultPercentage;
      if (input.requiresApproval !== undefined)
        category.requiresApproval = input.requiresApproval;
    }

    // UI-Felder duerfen auch bei System-Kategorien angepasst werden
    if (input.color !== undefined) category.color = input.color;
    if (input.iconName !== undefined) category.iconName = input.iconName;
    // sortOrder wird ausschliesslich ueber reorderEmployeeAbsenceCategories
    // veraendert — nicht ueber update. So gibt es keine Konflikte zwischen
    // Form-Submit und DnD.

    if (input.translations && input.translations.length > 0) {
      this.assertUniqueLocales(input.translations.map((t) => t.locale));
      await this.dataSource.transaction(async (m) => {
        for (const t of input.translations!) {
          await m.getRepository(EmployeeAbsenceCategoryTranslation).upsert(
            {
              categoryId: category.id,
              locale: t.locale,
              name: t.name,
              description: t.description ?? null,
            },
            ['categoryId', 'locale'],
          );
        }
      });
    }

    await this.categoriesRepo.save(category);
    return this.findOne(category.id, organizationId);
  }

  async archive(id: string, organizationId: string): Promise<boolean> {
    const category = await this.findOne(id, organizationId);
    if (category.isSystem) {
      throw new ConflictException(
        'System-Kategorien koennen nicht archiviert werden. Verwende isActive=false.',
      );
    }
    category.isArchived = true;
    await this.categoriesRepo.save(category);
    return true;
  }

  async reorder(
    ids: string[],
    organizationId: string,
  ): Promise<EmployeeAbsenceCategory[]> {
    const categories = await this.categoriesRepo.find({
      where: { id: In(ids), organizationId },
    });
    if (categories.length !== ids.length) {
      throw new NotFoundException(
        'One or more absence categories not found for this organization',
      );
    }
    const byId = new Map(categories.map((c) => [c.id, c]));
    const toSave = ids.map((id, index) => {
      const cat = byId.get(id)!;
      cat.sortOrder = index;
      return cat;
    });
    await this.categoriesRepo.save(toSave);
    return this.findEmployeeAbsenceCategoriesByOrgId(organizationId);
  }

  async setActive(
    id: string,
    organizationId: string,
    isActive: boolean,
  ): Promise<EmployeeAbsenceCategory> {
    const category = await this.findOne(id, organizationId);
    category.isActive = isActive;
    await this.categoriesRepo.save(category);
    return this.findOne(category.id, organizationId);
  }

  async upsertTranslation(
    input: UpsertEmployeeAbsenceCategoryTranslationInput,
    organizationId: string,
  ): Promise<EmployeeAbsenceCategoryTranslation> {
    await this.findOne(input.categoryId, organizationId);
    await this.translationsRepo.upsert(
      {
        categoryId: input.categoryId,
        locale: input.locale,
        name: input.name,
        description: input.description ?? null,
      },
      ['categoryId', 'locale'],
    );
    const translation = await this.translationsRepo.findOne({
      where: { categoryId: input.categoryId, locale: input.locale },
    });
    return translation!;
  }

  /**
   * Liefert den Default-Wert fuer `isVacationCapable` einer Absenz-Buchung,
   * basierend auf der Kategorie. Aufrufer (EmployeeAbsencesService) verwendet
   * das Ergebnis als Initialwert, der pro Buchung ueberschreibbar ist.
   */
  async getDefaultIsVacationCapable(
    categoryId: string,
    organizationId: string,
  ): Promise<boolean> {
    const category = await this.categoriesRepo.findOne({
      where: { id: categoryId, organizationId },
      select: ['id', 'defaultIsVacationCapable'],
    });
    if (!category) {
      throw new BadRequestException(
        `Employee absence category ${categoryId} not found for this organization`,
      );
    }
    return category.defaultIsVacationCapable;
  }

  private assertUniqueLocales(locales: string[]): void {
    const seen = new Set<string>();
    for (const l of locales) {
      if (seen.has(l)) {
        throw new ConflictException(`Duplicate locale "${l}" in translations`);
      }
      seen.add(l);
    }
  }
}
