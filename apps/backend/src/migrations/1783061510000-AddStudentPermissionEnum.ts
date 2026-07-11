import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the STUDENT_* permission enum values. Kept SEPARATE from the backfill
 * migration because PostgreSQL commits `ALTER TYPE ... ADD VALUE` in its own
 * transaction — a value added and used in the same migration fails on a fresh
 * PG16 DB (55P04). The catalog rows + role assignment live in
 * BackfillStudentPermissions.
 *
 * Forward-only: enum values cannot be removed in PostgreSQL, so `down` is a
 * no-op.
 */
export class AddStudentPermissionEnum1783061510000 implements MigrationInterface {
  name = 'AddStudentPermissionEnum1783061510000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'STUDENT_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'STUDENT_WRITE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'STUDENT_DELETE'`,
    );
  }

  public async down(): Promise<void> {
    // Enum values cannot be dropped in PostgreSQL — no-op.
  }
}
