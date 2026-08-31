import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * How far ahead employees may report an absence of a category (days from
 * today, null = open). Replaces the implicit "notice = today or tomorrow"
 * rule; existing notice-only categories keep that behaviour via 1.
 */
export class AddAbsenceCategoryMaxDaysAhead1786900800000 implements MigrationInterface {
  name = 'AddAbsenceCategoryMaxDaysAhead1786900800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" ADD "max_days_ahead" integer`,
    );
    await queryRunner.query(
      `UPDATE "employee_absence_categories" SET "max_days_ahead" = 1 WHERE "requires_approval" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" DROP COLUMN "max_days_ahead"`,
    );
  }
}
