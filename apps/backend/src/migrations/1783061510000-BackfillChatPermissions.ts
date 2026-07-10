import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the CHAT_* permission codes and assigns them to system roles. Separate
 * migration from CreateChats so the enum values added there (ADD VALUE) are
 * committed in their own transaction first — PG16 rejects using a freshly
 * added enum value in the same transaction (55P04), and
 * migrationsTransactionMode is 'each'.
 *
 * Chat is an internal collaboration tool: every system role gets both
 * CHAT_READ and CHAT_WRITE (mirrors assign-permissions-to-system-roles.seeder).
 */
export class BackfillChatPermissions1783061510000 implements MigrationInterface {
  name = 'BackfillChatPermissions1783061510000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('CHAT_READ', 'Chats lesen'),
        ('CHAT_WRITE', 'Chats schreiben')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" IN ('CHAT_READ', 'CHAT_WRITE')
      WHERE r."is_system" = true
        AND r."system_code" IN (
          'ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE'
        )
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions" WHERE "code" IN ('CHAT_READ', 'CHAT_WRITE')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions" WHERE "code" IN ('CHAT_READ', 'CHAT_WRITE')
    `);
  }
}
