import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds SHIFT_MANAGE and grants it to the management roles of every existing
 * org (mirrors assign-permissions-to-system-roles.seeder). Separate from
 * CreateShifts because that migration adds the enum value (PG16 55P04).
 */
export class BackfillShiftPermissions1787100100000 implements MigrationInterface {
  name = 'BackfillShiftPermissions1787100100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('SHIFT_MANAGE', 'Schichten verwalten')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'SHIFT_MANAGE'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions" WHERE "code" = 'SHIFT_MANAGE'
      )
    `);
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "code" = 'SHIFT_MANAGE'`,
    );
  }
}
