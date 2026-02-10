import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { seedOrgEmployeeAbsenceCategories } from './seeds/seed-org-employee-absence-categories.seeder';
import { EmployeeAbsenceCategory } from './entities/employee-absence-category.entity';

@Injectable()
export class EmployeeAbsenceCategoriesService {
  constructor(private readonly entityManager: EntityManager) {}

  async seedOrgEmployeeAbsenceCategories(orgId: string) {
    await this.entityManager.transaction(async (mananger) => {
      await seedOrgEmployeeAbsenceCategories(mananger, orgId);
      return true;
    });
  }

  async findEmployeeAbsenceCategoriesByOrgId(organizationId: string) {
    return this.entityManager.findBy(EmployeeAbsenceCategory, {
      organizationId,
    });
  }
}
