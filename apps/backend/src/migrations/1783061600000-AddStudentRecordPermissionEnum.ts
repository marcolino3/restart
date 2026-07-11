import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the STUDENT_RECORD_* permission enum values (Scope 2 — Förderprofil).
 * Kept SEPARATE from the backfill migration because PostgreSQL commits
 * `ALTER TYPE ... ADD VALUE` in its own transaction — a value added and used
 * in the same migration fails on a fresh PG16 DB (55P04). The catalog rows +
 * role assignment live in BackfillStudentRecordPermissions.
 *
 * Forward-only: enum values cannot be removed in PostgreSQL, so `down` is a
 * no-op.
 */
export class AddStudentRecordPermissionEnum1783061600000 implements MigrationInterface {
  name = 'AddStudentRecordPermissionEnum1783061600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'STUDENT_RECORD_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'STUDENT_RECORD_WRITE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'STUDENT_RECORD_DELETE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'STUDENT_RECORD_CATEGORY_WRITE'`,
    );
  }

  public async down(): Promise<void> {
    // Enum values cannot be dropped in PostgreSQL — no-op.
  }
}
