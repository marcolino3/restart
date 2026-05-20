import { EntityManager, In } from 'typeorm';
import { Locale } from '@/database/enums/locale.enum';
import { EmployeeAbsenceCategory } from '../entities/employee-absence-category.entity';
import { EmployeeAbsenceCategoryTranslation } from '../entities/employee-absence-category-translation.entity';
import {
  SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES,
  SystemEmployeeAbsenceCategoryDefaults,
} from './system-employee-absence-categories';

/**
 * Seed System-Absenzkategorien fuer eine Organisation. Idempotent:
 * - Fehlende Kategorien werden angelegt (mit allen Default-Feldern + Translations).
 * - Vorhandene Kategorien werden NICHT ueberschrieben (Org darf Felder anpassen).
 * - Translations werden NUR angelegt fuer Locales, die fuer diese Kategorie noch fehlen.
 */
export async function seedOrgEmployeeAbsenceCategories(
  manager: EntityManager,
  organizationId: string,
) {
  const codes = SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES.map((d) => d.code);
  const categoriesRepo = manager.getRepository(EmployeeAbsenceCategory);
  const translationsRepo = manager.getRepository(
    EmployeeAbsenceCategoryTranslation,
  );

  const existing = await categoriesRepo.find({
    where: { organizationId, systemCode: In(codes) },
    select: ['id', 'systemCode'],
  });
  const byCode = new Map(existing.map((e) => [e.systemCode!, e]));

  // 1) Fehlende Kategorien anlegen
  const missing = SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES.filter(
    (d) => !byCode.has(d.code),
  );
  for (const def of missing) {
    const created = categoriesRepo.create(
      buildCategoryFromDefaults(def, organizationId),
    );
    const saved = await categoriesRepo.save(created);
    byCode.set(def.code, saved);
  }

  // 2) Translations idempotent ergaenzen
  const allCategoryIds = Array.from(byCode.values()).map((c) => c.id);
  const existingTranslations = allCategoryIds.length
    ? await translationsRepo.find({
        where: { categoryId: In(allCategoryIds) },
        select: ['id', 'categoryId', 'locale'],
      })
    : [];
  const seenByCategory = new Map<string, Set<Locale>>();
  for (const t of existingTranslations) {
    if (!seenByCategory.has(t.categoryId)) {
      seenByCategory.set(t.categoryId, new Set());
    }
    seenByCategory.get(t.categoryId)!.add(t.locale);
  }

  const toCreate: Partial<EmployeeAbsenceCategoryTranslation>[] = [];
  for (const def of SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES) {
    const cat = byCode.get(def.code);
    if (!cat) continue;
    const present = seenByCategory.get(cat.id) ?? new Set<Locale>();
    for (const locale of Object.keys(def.translations) as Locale[]) {
      if (present.has(locale)) continue;
      const t = def.translations[locale];
      toCreate.push({
        categoryId: cat.id,
        locale,
        name: t.name,
        description: t.description ?? null,
      });
    }
  }
  if (toCreate.length) {
    await translationsRepo.insert(toCreate);
  }
}

function buildCategoryFromDefaults(
  def: SystemEmployeeAbsenceCategoryDefaults,
  organizationId: string,
): Partial<EmployeeAbsenceCategory> {
  return {
    organizationId,
    systemCode: def.code,
    isSystem: true,
    isActive: true,
    countsAsWorkTime: def.countsAsWorkTime,
    isPaid: def.isPaid,
    affectsVacationBalance: def.affectsVacationBalance,
    defaultIsVacationCapable: def.defaultIsVacationCapable,
    reducesVacationEntitlementAfterDays:
      def.reducesVacationEntitlementAfterDays,
    requiresCertificate: def.requiresCertificate,
    certificateRequiredFromDay: def.certificateRequiredFromDay,
    maxDaysPerYear: def.maxDaysPerYear,
    defaultPercentage: def.defaultPercentage,
    requiresApproval: def.requiresApproval,
    color: def.color,
    iconName: def.iconName,
    sortOrder: def.sortOrder,
  };
}
