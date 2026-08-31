import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Appointment-style system absence categories (medical, therapy, official
 * appointments) plus WEDDING. Only the enum values are added here; the rows
 * are seeded in the next migration (PG16 refuses to use a value added by
 * ALTER TYPE in the same transaction — SQLSTATE 55P04).
 */
export class AddAppointmentAbsenceCategoryEnumValues1786900400000 implements MigrationInterface {
  name = 'AddAppointmentAbsenceCategoryEnumValues1786900400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."employee_absence_categories_system_code_enum" ADD VALUE IF NOT EXISTS 'MEDICAL_APPOINTMENT'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."employee_absence_categories_system_code_enum" ADD VALUE IF NOT EXISTS 'THERAPY_APPOINTMENT'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."employee_absence_categories_system_code_enum" ADD VALUE IF NOT EXISTS 'OFFICIAL_APPOINTMENT'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."employee_absence_categories_system_code_enum" ADD VALUE IF NOT EXISTS 'WEDDING'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop enum values; forward-only.
  }
}
