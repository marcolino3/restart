import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Entry precision per absence category (DAY / HALF_DAY / TIME, varchar) and
 * the day part of an absence (FULL / MORNING / AFTERNOON). System categories
 * get their intended precision; a TIME category never allows date ranges.
 */
export class AddAbsenceEntryPrecision1786900600000 implements MigrationInterface {
  name = 'AddAbsenceEntryPrecision1786900600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" ADD COLUMN IF NOT EXISTS "entry_precision" character varying(16) NOT NULL DEFAULT 'DAY'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "day_part" character varying(16) NOT NULL DEFAULT 'FULL'`,
    );
    await queryRunner.query(
      `UPDATE "employee_absence_categories" SET "entry_precision" = 'TIME', "allows_date_range" = false, "max_days_per_request" = NULL WHERE "system_code" IN ('MEDICAL_APPOINTMENT', 'THERAPY_APPOINTMENT', 'OFFICIAL_APPOINTMENT')`,
    );
    await queryRunner.query(
      `UPDATE "employee_absence_categories" SET "entry_precision" = 'HALF_DAY' WHERE "system_code" IN ('SICKNESS', 'ACCIDENT', 'CHILDCARE_SICK', 'FUNERAL', 'OTHER')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "day_part"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" DROP COLUMN IF EXISTS "entry_precision"`,
    );
  }
}
