import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * VACATION system absence category. Only the enum value is added here; the
 * rows are seeded in the next migration (PG16 refuses to use a value added
 * by ALTER TYPE in the same transaction — SQLSTATE 55P04).
 */
export class AddVacationAbsenceCategoryEnumValue1786900100000 implements MigrationInterface {
  name = 'AddVacationAbsenceCategoryEnumValue1786900100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."employee_absence_categories_system_code_enum" ADD VALUE IF NOT EXISTS 'VACATION'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop enum values; forward-only.
  }
}
