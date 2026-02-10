/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/employee-management/absences/seed/seed-org-employee-absence-categories.ts
import { EntityManager, In } from 'typeorm';
import { EmployeeAbsenceCategory } from '../entities/employee-absence-category.entity';
import { SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES } from './system-employee-absence-categories';

export async function seedOrgEmployeeAbsenceCategories(
  manager: EntityManager,
  organizationId: string,
) {
  const codes = SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES.map((d) => d.code);

  // Vorhandene System-Gruende laden
  const existing = await manager.find(EmployeeAbsenceCategory, {
    where: { organizationId, systemCode: In(codes) },
    select: ['id', 'systemCode', 'isSystem'],
  });

  const byCode = new Map(existing.map((e) => [e.systemCode!, e]));

  const toInsert: Partial<EmployeeAbsenceCategory>[] = [];
  const toUpdate: Partial<EmployeeAbsenceCategory>[] = [];

  for (const { code } of SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES) {
    const found = byCode.get(code);
    if (!found) {
      // fehlt → neu anlegen
      toInsert.push({
        organizationId,
        systemCode: code,
        isSystem: true,
        isActive: true,
      } as any);
    }
  }

  if (toInsert.length) {
    const repo = manager.getRepository(EmployeeAbsenceCategory);
    await repo.insert(toInsert);
  }

  if (toUpdate.length) {
    const repo = manager.getRepository(EmployeeAbsenceCategory);
    await repo.save(toUpdate);
  }
}
