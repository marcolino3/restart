import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the CONSENT_* permission codes into the catalog and assigns them to the
 * existing system roles of every organization. Separate migration so the enum
 * values added in CreateConsent are committed first.
 *
 * Matrix (mirrors assign-permissions-to-system-roles.seeder.ts):
 *   - CONSENT_READ            → all system roles
 *   - CONSENT_MANAGE          → ORG_OWNER, ORG_ADMIN, HR_MANAGER, OFFICE
 *   - CONSENT_SETTINGS_MANAGE → ORG_OWNER, ORG_ADMIN, OFFICE
 */
export class BackfillConsentPermissions1783060980000 implements MigrationInterface {
  name = 'BackfillConsentPermissions1783060980000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('CONSENT_READ', 'Einwilligungen lesen'),
        ('CONSENT_MANAGE', 'Einwilligungen erfassen/widerrufen'),
        ('CONSENT_SETTINGS_MANAGE', 'Einwilligungs-Zwecke verwalten')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'CONSENT_READ'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'CONSENT_MANAGE'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'CONSENT_SETTINGS_MANAGE'
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
        WHERE "code" IN ('CONSENT_READ', 'CONSENT_MANAGE', 'CONSENT_SETTINGS_MANAGE')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN ('CONSENT_READ', 'CONSENT_MANAGE', 'CONSENT_SETTINGS_MANAGE')
    `);
  }
}
