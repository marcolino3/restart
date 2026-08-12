import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The role & permissions redesign adds admissionAuditLog.{oldValue,newValue}
 * to PROTECTED_FIELD_CATALOG (packages/shared-schemas/src/rbac/field-catalog.ts),
 * analogous to the already-protected employeeAuditLog fields. From that point
 * on the global field middleware nulls those fields for any role without an
 * explicit role_field_permissions row.
 *
 * Backfill READ access for the system roles that could already read admission
 * audit logs before this catalog entry existed (ORG_OWNER, ORG_ADMIN, OFFICE),
 * so this addition doesn't silently hide data that was previously visible.
 * Purely additive data seed, no schema change - safe with
 * migrationsTransactionMode: 'each'.
 */
export class SeedAdmissionAuditFieldPermissions1786400000000 implements MigrationInterface {
  name = 'SeedAdmissionAuditFieldPermissions1786400000000';

  private readonly systemCodes = ['ORG_OWNER', 'ORG_ADMIN', 'OFFICE'];
  private readonly fields = ['oldValue', 'newValue'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const field of this.fields) {
      await queryRunner.query(
        `
          INSERT INTO "role_field_permissions" ("role_id", "resource", "field", "actions")
          SELECT "id", 'admissionAuditLog', $2, '{read}'
          FROM "roles"
          WHERE "system_code" = ANY($1::"public"."roles_system_code_enum"[])
          ON CONFLICT ("role_id", "resource", "field") DO NOTHING
        `,
        [this.systemCodes, field],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DELETE FROM "role_field_permissions"
        WHERE "resource" = 'admissionAuditLog'
          AND "field" = ANY($1::varchar[])
          AND "role_id" IN (
            SELECT "id" FROM "roles" WHERE "system_code" = ANY($2::"public"."roles_system_code_enum"[])
          )
      `,
      [this.fields, this.systemCodes],
    );
  }
}
