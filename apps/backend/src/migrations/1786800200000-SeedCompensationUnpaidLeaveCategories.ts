import { MigrationInterface, QueryRunner } from 'typeorm';
import { backfillEmployeeAbsenceCategoriesForAllOrgs } from '@/employee-management/employee-absence-categories/seeds/backfill-system-employee-absence-categories';

/**
 * Seeds the new COMPENSATION and UNPAID_LEAVE system categories (plus any
 * missing translations) into every existing organization. The seeder is
 * idempotent and never overwrites categories an org already configured.
 * Runs in its own transaction, after the enum values were committed.
 */
export class SeedCompensationUnpaidLeaveCategories1786800200000 implements MigrationInterface {
  name = 'SeedCompensationUnpaidLeaveCategories1786800200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await backfillEmployeeAbsenceCategoriesForAllOrgs(queryRunner.manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "employee_absence_categories" WHERE "system_code" IN ('COMPENSATION', 'UNPAID_LEAVE')`,
    );
  }
}
