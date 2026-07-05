import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the RETENTION_* permission codes and assigns them to system roles.
 * Separate migration so the enum values from CreateRetentionPolicies are
 * committed first.
 *
 * Matrix (mirrors assign-permissions-to-system-roles.seeder.ts):
 *   RETENTION_READ   → ORG_OWNER, ORG_ADMIN, HR_MANAGER, OFFICE
 *   RETENTION_MANAGE → ORG_OWNER, ORG_ADMIN, OFFICE
 */
export class BackfillRetentionPermissions1783061030000 implements MigrationInterface {
  name = 'BackfillRetentionPermissions1783061030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('RETENTION_READ', 'Aufbewahrungsfristen lesen'),
        ('RETENTION_MANAGE', 'Aufbewahrungsfristen verwalten')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'RETENTION_READ'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'RETENTION_MANAGE'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'OFFICE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions"
        WHERE "code" IN ('RETENTION_READ', 'RETENTION_MANAGE')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN ('RETENTION_READ', 'RETENTION_MANAGE')
    `);
  }
}
