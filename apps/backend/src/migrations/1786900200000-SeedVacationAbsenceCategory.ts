import { MigrationInterface, QueryRunner } from 'typeorm';
import { backfillEmployeeAbsenceCategoriesForAllOrgs } from '@/employee-management/employee-absence-categories/seeds/backfill-system-employee-absence-categories';

/**
 * Seeds the VACATION system category (plus any missing translations) into
 * every existing organization. Idempotent; never overwrites categories an
 * org already configured. Runs after the enum value was committed.
 */
export class SeedVacationAbsenceCategory1786900200000 implements MigrationInterface {
  name = 'SeedVacationAbsenceCategory1786900200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await backfillEmployeeAbsenceCategoriesForAllOrgs(queryRunner.manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "employee_absence_categories" WHERE "system_code" = 'VACATION'`,
    );
  }
}
