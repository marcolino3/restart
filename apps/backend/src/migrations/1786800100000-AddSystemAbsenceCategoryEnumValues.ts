import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * New system absence categories. Only the enum values are added here; the
 * rows are seeded in the next migration (PG16 refuses to use a value added
 * by ALTER TYPE in the same transaction — SQLSTATE 55P04).
 */
export class AddSystemAbsenceCategoryEnumValues1786800100000 implements MigrationInterface {
  name = 'AddSystemAbsenceCategoryEnumValues1786800100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."employee_absence_categories_system_code_enum" ADD VALUE IF NOT EXISTS 'COMPENSATION'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."employee_absence_categories_system_code_enum" ADD VALUE IF NOT EXISTS 'UNPAID_LEAVE'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop enum values; forward-only.
  }
}
