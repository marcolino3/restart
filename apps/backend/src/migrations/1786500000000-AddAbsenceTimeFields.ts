import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Optional time-of-day bounds for an absence. NULL on both means the absence
 * covers whole days (the existing behaviour); `start_time` is set when an
 * employee reports sick from a given hour, e.g. midday.
 */
export class AddAbsenceTimeFields1786500000000 implements MigrationInterface {
  name = 'AddAbsenceTimeFields1786500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "start_time" time`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "end_time" time`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "end_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "start_time"`,
    );
  }
}
