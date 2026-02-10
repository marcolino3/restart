import { EntityManager } from 'typeorm';
import { Organization } from '@/organizations/entities/organization.entity';
import { seedOrgEmployeeAbsenceCategories } from './seed-org-employee-absence-categories.seeder';

export async function backfillEmployeeAbsenceCategoriesForAllOrgs(
  manager: EntityManager,
) {
  const orgs = await manager.find(Organization, {
    select: ['id'],
    where: { isArchived: false },
  });

  for (const org of orgs) {
    await seedOrgEmployeeAbsenceCategories(manager, org.id);
  }
}
