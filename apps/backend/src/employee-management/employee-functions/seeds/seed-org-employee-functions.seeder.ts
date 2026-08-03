import { EntityManager } from 'typeorm';
import { Locale } from '@/database/enums/locale.enum';
import { EmployeeFunction } from '../entities/employee-function.entity';
import { EmployeeFunctionTranslation } from '../entities/employee-function-translation.entity';
import { DEFAULT_EMPLOYEE_FUNCTIONS } from './default-employee-functions';

/**
 * Seed default employee functions for a new organization. Idempotent:
 * existing DE names are left untouched so orgs can customize their list.
 */
export async function seedOrgEmployeeFunctions(
  manager: EntityManager,
  organizationId: string,
): Promise<void> {
  const fnRepo = manager.getRepository(EmployeeFunction);
  const trRepo = manager.getRepository(EmployeeFunctionTranslation);

  const existing = await fnRepo.find({
    where: { organizationId },
    select: ['id', 'name'],
  });
  const byDeName = new Map(existing.map((f) => [f.name, f]));

  for (const [index, def] of DEFAULT_EMPLOYEE_FUNCTIONS.entries()) {
    let fn = byDeName.get(def.deName);
    if (!fn) {
      fn = await fnRepo.save(
        fnRepo.create({
          name: def.deName,
          sortOrder: index,
          organizationId,
        }),
      );
      byDeName.set(def.deName, fn);
    }

    const existingTr = await trRepo.find({
      where: { functionId: fn.id },
      select: ['locale'],
    });
    const present = new Set(existingTr.map((t) => t.locale));

    const toInsert = (
      Object.entries(def.translations) as [Locale, { name: string }][]
    )
      .filter(([locale]) => !present.has(locale))
      .map(([locale, t]) =>
        trRepo.create({
          functionId: fn.id,
          locale,
          name: t.name,
        }),
      );

    if (toInsert.length) {
      await trRepo.save(toInsert);
    }
  }
}
