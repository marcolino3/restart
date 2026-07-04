import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the DATA_BREACH_* permission codes and assigns them to system roles.
 * Separate migration so the enum values from CreateDataBreaches are committed
 * first.
 *
 * Matrix (mirrors assign-permissions-to-system-roles.seeder.ts):
 *   DATA_BREACH_READ   → ORG_OWNER, ORG_ADMIN, HR_MANAGER, OFFICE
 *   DATA_BREACH_MANAGE → ORG_OWNER, ORG_ADMIN, OFFICE
 */
export class BackfillDataBreachPermissions1783061050000
  implements MigrationInterface
{
  name = 'BackfillDataBreachPermissions1783061050000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('DATA_BREACH_READ', 'Datenpannen lesen'),
        ('DATA_BREACH_MANAGE', 'Datenpannen bearbeiten')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'DATA_BREACH_READ'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'DATA_BREACH_MANAGE'
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
        WHERE "code" IN ('DATA_BREACH_READ', 'DATA_BREACH_MANAGE')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN ('DATA_BREACH_READ', 'DATA_BREACH_MANAGE')
    `);
  }
}
