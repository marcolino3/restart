import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the class budget permission codes and assigns them to system roles for
 * existing orgs. Separate migration so the enum values from
 * AddClassBudgetPermissionEnum are committed first.
 *
 * Matrix (mirrors assign-permissions-to-system-roles.seeder.ts). Teachers
 * (TEAM_LEAD/EMPLOYEE) record expenses; which classes they may touch is
 * narrowed further by ClassBudgetAccessService:
 *   CLASS_BUDGET_MANAGE → ORG_OWNER, ORG_ADMIN, OFFICE
 *   CLASS_EXPENSE_READ  → ORG_OWNER, ORG_ADMIN, OFFICE, TEAM_LEAD, EMPLOYEE
 *   CLASS_EXPENSE_WRITE → ORG_OWNER, ORG_ADMIN, OFFICE, TEAM_LEAD, EMPLOYEE
 */
export class BackfillClassBudgetPermissions1789400010000 implements MigrationInterface {
  name = 'BackfillClassBudgetPermissions1789400010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('CLASS_BUDGET_MANAGE', 'Klassenbudgets und Ausgabenkategorien verwalten'),
        ('CLASS_EXPENSE_READ', 'Klassenausgaben lesen'),
        ('CLASS_EXPENSE_WRITE', 'Klassenausgaben erfassen')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'CLASS_BUDGET_MANAGE'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'OFFICE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p
        ON p."code" IN ('CLASS_EXPENSE_READ', 'CLASS_EXPENSE_WRITE')
      WHERE r."is_system" = true
        AND r."system_code" IN
          ('ORG_OWNER', 'ORG_ADMIN', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions"
        WHERE "code" IN (
          'CLASS_BUDGET_MANAGE', 'CLASS_EXPENSE_READ', 'CLASS_EXPENSE_WRITE'
        )
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN (
        'CLASS_BUDGET_MANAGE', 'CLASS_EXPENSE_READ', 'CLASS_EXPENSE_WRITE'
      )
    `);
  }
}
