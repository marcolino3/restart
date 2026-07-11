import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the STUDENT_RECORD_* permission codes (Scope 2 — Förderprofil) and
 * assigns them to system roles for existing orgs. Separate migration so the
 * enum values from AddStudentRecordPermissionEnum are committed first.
 *
 * Matrix (mirrors assign-permissions-to-system-roles.seeder.ts). Support-record
 * data is more sensitive than master data, so DELETE + CATEGORY_WRITE stay
 * narrow; teachers (TEAM_LEAD/EMPLOYEE) may READ + WRITE entries:
 *   STUDENT_RECORD_READ           → ORG_OWNER, ORG_ADMIN, OFFICE, TEAM_LEAD, EMPLOYEE
 *   STUDENT_RECORD_WRITE          → ORG_OWNER, ORG_ADMIN, OFFICE, TEAM_LEAD, EMPLOYEE
 *   STUDENT_RECORD_DELETE         → ORG_OWNER, ORG_ADMIN, OFFICE
 *   STUDENT_RECORD_CATEGORY_WRITE → ORG_OWNER, ORG_ADMIN
 */
export class BackfillStudentRecordPermissions1783061610000 implements MigrationInterface {
  name = 'BackfillStudentRecordPermissions1783061610000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('STUDENT_RECORD_READ', 'Foerderprofil lesen'),
        ('STUDENT_RECORD_WRITE', 'Foerderprofil schreiben'),
        ('STUDENT_RECORD_DELETE', 'Foerderprofil loeschen'),
        ('STUDENT_RECORD_CATEGORY_WRITE', 'Foerderkategorien verwalten')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'STUDENT_RECORD_READ'
      WHERE r."is_system" = true
        AND r."system_code" IN
          ('ORG_OWNER', 'ORG_ADMIN', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'STUDENT_RECORD_WRITE'
      WHERE r."is_system" = true
        AND r."system_code" IN
          ('ORG_OWNER', 'ORG_ADMIN', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'STUDENT_RECORD_DELETE'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'OFFICE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'STUDENT_RECORD_CATEGORY_WRITE'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions"
        WHERE "code" IN (
          'STUDENT_RECORD_READ', 'STUDENT_RECORD_WRITE',
          'STUDENT_RECORD_DELETE', 'STUDENT_RECORD_CATEGORY_WRITE'
        )
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN (
        'STUDENT_RECORD_READ', 'STUDENT_RECORD_WRITE',
        'STUDENT_RECORD_DELETE', 'STUDENT_RECORD_CATEGORY_WRITE'
      )
    `);
  }
}
