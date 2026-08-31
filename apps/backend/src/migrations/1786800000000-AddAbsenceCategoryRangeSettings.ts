import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Self-service range settings per absence category: whether an employee may
 * report several days at once and, optionally, how many per request.
 * Existing approval categories keep their multi-day behaviour.
 */
export class AddAbsenceCategoryRangeSettings1786800000000 implements MigrationInterface {
  name = 'AddAbsenceCategoryRangeSettings1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" ADD COLUMN IF NOT EXISTS "allows_date_range" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" ADD COLUMN IF NOT EXISTS "max_days_per_request" integer`,
    );
    await queryRunner.query(
      `UPDATE "employee_absence_categories" SET "allows_date_range" = true WHERE "requires_approval" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" DROP COLUMN IF EXISTS "max_days_per_request"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" DROP COLUMN IF EXISTS "allows_date_range"`,
    );
  }
}
