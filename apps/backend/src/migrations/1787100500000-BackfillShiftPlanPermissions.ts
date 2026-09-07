import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds SHIFT_PLAN_READ / SHIFT_PLAN_WRITE and grants them to the system
 * roles of every existing org (mirrors assign-permissions-to-system-roles).
 * Separate from CreateShiftPlans because that migration adds the enum values.
 */
export class BackfillShiftPlanPermissions1787100500000 implements MigrationInterface {
  name = 'BackfillShiftPlanPermissions1787100500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('SHIFT_PLAN_READ', 'Schichtplan lesen'),
        ('SHIFT_PLAN_WRITE', 'Schichtplan bearbeiten')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" IN ('SHIFT_PLAN_READ', 'SHIFT_PLAN_WRITE')
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'TEAM_LEAD')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'SHIFT_PLAN_READ'
      WHERE r."is_system" = true
        AND r."system_code" = 'EMPLOYEE'
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions"
        WHERE "code" IN ('SHIFT_PLAN_READ', 'SHIFT_PLAN_WRITE')
      )
    `);
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "code" IN ('SHIFT_PLAN_READ', 'SHIFT_PLAN_WRITE')`,
    );
  }
}
