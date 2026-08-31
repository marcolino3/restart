import { MigrationInterface, QueryRunner } from 'typeorm';
import { backfillEmployeeAbsenceCategoriesForAllOrgs } from '@/employee-management/employee-absence-categories/seeds/backfill-system-employee-absence-categories';

/**
 * Seeds the appointment system categories (MEDICAL_APPOINTMENT,
 * THERAPY_APPOINTMENT, OFFICIAL_APPOINTMENT) and WEDDING into every existing
 * organization. Idempotent; never overwrites categories an org already
 * configured. Runs after the enum values were committed.
 */
export class SeedAppointmentAbsenceCategories1786900500000 implements MigrationInterface {
  name = 'SeedAppointmentAbsenceCategories1786900500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await backfillEmployeeAbsenceCategoriesForAllOrgs(queryRunner.manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "employee_absence_categories" WHERE "system_code" IN ('MEDICAL_APPOINTMENT', 'THERAPY_APPOINTMENT', 'OFFICIAL_APPOINTMENT', 'WEDDING')`,
    );
  }
}
