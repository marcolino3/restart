import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the DATA_REQUEST_* permission codes and assigns them to the system
 * roles that handle data-subject requests. Separate migration so the enum
 * values added in CreateDataSubjectRequests are committed first.
 *
 * Matrix (mirrors assign-permissions-to-system-roles.seeder.ts):
 *   DATA_REQUEST_READ / DATA_REQUEST_MANAGE → ORG_OWNER, ORG_ADMIN, HR_MANAGER, OFFICE
 */
export class BackfillDataRequestPermissions1783061010000
  implements MigrationInterface
{
  name = 'BackfillDataRequestPermissions1783061010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('DATA_REQUEST_READ', 'Betroffenenanfragen lesen'),
        ('DATA_REQUEST_MANAGE', 'Betroffenenanfragen bearbeiten')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    for (const code of ['DATA_REQUEST_READ', 'DATA_REQUEST_MANAGE']) {
      await queryRunner.query(
        `
        INSERT INTO "role_permissions" ("role_id", "permission_id")
        SELECT r."id", p."id"
        FROM "roles" r
        JOIN "permissions" p ON p."code" = $1
        WHERE r."is_system" = true
          AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE')
        ON CONFLICT ("role_id", "permission_id") DO NOTHING
      `,
        [code],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions"
        WHERE "code" IN ('DATA_REQUEST_READ', 'DATA_REQUEST_MANAGE')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN ('DATA_REQUEST_READ', 'DATA_REQUEST_MANAGE')
    `);
  }
}
