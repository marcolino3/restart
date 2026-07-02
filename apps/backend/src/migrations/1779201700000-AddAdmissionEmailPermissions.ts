import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The admissions e-mail feature added two permission codes
 * (ADMISSION_EMAIL_TEMPLATE_MANAGE, ADMISSION_EMAIL_SEND) to the
 * PermissionCode enum. They were never added to the Postgres
 * `permissions_code_enum` type because the feature was developed under
 * `synchronize`. On the migration-driven path the permission seeder fails with
 * `invalid input value for enum permissions_code_enum`. Add the missing values.
 *
 * `ADD VALUE` is not transactional-usable in the same tx, but we only add the
 * values here (the seeder runs at app startup, in a later transaction), so this
 * is safe on PostgreSQL 12+.
 */
export class AddAdmissionEmailPermissions1779201700000 implements MigrationInterface {
  name = 'AddAdmissionEmailPermissions1779201700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'ADMISSION_EMAIL_TEMPLATE_MANAGE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'ADMISSION_EMAIL_SEND'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing values from an enum type; no-op.
    // (Forward-only / expand-contract — see CLAUDE.md.)
  }
}
