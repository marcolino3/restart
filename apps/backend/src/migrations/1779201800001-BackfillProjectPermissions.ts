import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the four project-management permission codes into the catalog and
 * assigns them to the existing system roles of every organization.
 *
 * Runs as its own migration (after CreateProjectManagement committed the new
 * enum values) because a freshly ADDed enum value cannot be used in the same
 * transaction it was added in.
 *
 * Assignment matrix mirrors
 * roles/seeds/assign-permissions-to-system-roles.seeder.ts:
 *   - PROJECT_READ, PROJECT_CREATE                      → all system roles
 *   - PROJECT_MANAGE_ALL, PROJECT_TEMPLATE_MANAGE       → OWNER, ADMIN, OFFICE
 */
export class BackfillProjectPermissions1779201800001 implements MigrationInterface {
  name = 'BackfillProjectPermissions1779201800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Ensure the permission rows exist (idempotent on the unique code).
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('PROJECT_READ', 'Projekte nutzen/lesen'),
        ('PROJECT_CREATE', 'Projekt erstellen'),
        ('PROJECT_MANAGE_ALL', 'Alle Projekte verwalten (org-weit)'),
        ('PROJECT_TEMPLATE_MANAGE', 'Projekt-Vorlagen verwalten')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    // 2) Baseline (read + create) for every system role of every org.
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" IN ('PROJECT_READ', 'PROJECT_CREATE')
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    // 3) Org-wide management for owner/admin/office.
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" IN ('PROJECT_MANAGE_ALL', 'PROJECT_TEMPLATE_MANAGE')
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
        WHERE "code" IN ('PROJECT_READ', 'PROJECT_CREATE', 'PROJECT_MANAGE_ALL', 'PROJECT_TEMPLATE_MANAGE')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN ('PROJECT_READ', 'PROJECT_CREATE', 'PROJECT_MANAGE_ALL', 'PROJECT_TEMPLATE_MANAGE')
    `);
  }
}
