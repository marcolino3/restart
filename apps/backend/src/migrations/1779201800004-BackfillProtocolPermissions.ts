import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the PROTOCOL_* permission codes into the catalog and assigns them to the
 * existing system roles of every organization. Separate migration so the enum
 * values added in CreateProtocols are committed first.
 *
 * Matrix (mirrors assign-permissions-to-system-roles.seeder.ts):
 *   - PROTOCOL_READ   → all system roles
 *   - PROTOCOL_WRITE  → all system roles (every employee may create/edit)
 *   - PROTOCOL_DELETE → ORG_OWNER, ORG_ADMIN, OFFICE (also the "manage any" flag)
 */
export class BackfillProtocolPermissions1779201800004 implements MigrationInterface {
  name = 'BackfillProtocolPermissions1779201800004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('PROTOCOL_READ', 'Protokolle lesen'),
        ('PROTOCOL_WRITE', 'Protokolle erstellen/bearbeiten'),
        ('PROTOCOL_DELETE', 'Protokolle loeschen')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'PROTOCOL_READ'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'PROTOCOL_WRITE'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'PROTOCOL_DELETE'
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
        WHERE "code" IN ('PROTOCOL_READ', 'PROTOCOL_WRITE', 'PROTOCOL_DELETE')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN ('PROTOCOL_READ', 'PROTOCOL_WRITE', 'PROTOCOL_DELETE')
    `);
  }
}
