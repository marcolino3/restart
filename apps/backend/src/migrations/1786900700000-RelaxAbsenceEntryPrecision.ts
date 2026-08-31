import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Entry precision becomes an upper bound (TIME ⊃ HALF_DAY ⊃ DAY) instead of
 * a fixed entry form, so time-of-day categories may allow date ranges again
 * and sickness-type categories accept a time of day ("left at 15:00").
 */
export class RelaxAbsenceEntryPrecision1786900700000 implements MigrationInterface {
  name = 'RelaxAbsenceEntryPrecision1786900700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "employee_absence_categories" SET "entry_precision" = 'TIME' WHERE "system_code" IN ('SICKNESS', 'ACCIDENT', 'CHILDCARE_SICK')`,
    );
    await queryRunner.query(
      `UPDATE "employee_absence_categories" SET "entry_precision" = 'HALF_DAY' WHERE "system_code" IN ('VACATION', 'COMPENSATION')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "employee_absence_categories" SET "entry_precision" = 'HALF_DAY' WHERE "system_code" IN ('SICKNESS', 'ACCIDENT', 'CHILDCARE_SICK')`,
    );
    await queryRunner.query(
      `UPDATE "employee_absence_categories" SET "entry_precision" = 'DAY' WHERE "system_code" IN ('VACATION', 'COMPENSATION')`,
    );
  }
}
