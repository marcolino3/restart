import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the STUDENT_* permission codes and assigns them to system roles for
 * existing orgs. Separate migration so the enum values from
 * AddStudentPermissionEnum are committed first.
 *
 * Matrix (mirrors assign-permissions-to-system-roles.seeder.ts, following the
 * CONTACT_PERSON_* model — personal data, so OFFICE also gets delete):
 *   STUDENT_READ   → ORG_OWNER, ORG_ADMIN, HR_MANAGER, OFFICE, TEAM_LEAD, EMPLOYEE
 *   STUDENT_WRITE  → ORG_OWNER, ORG_ADMIN, OFFICE
 *   STUDENT_DELETE → ORG_OWNER, ORG_ADMIN, OFFICE
 */
export class BackfillStudentPermissions1783061520000 implements MigrationInterface {
  name = 'BackfillStudentPermissions1783061520000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "version", "name", "code")
      SELECT uuid_generate_v4(), 1, v.name, v.code::"public"."permissions_code_enum"
      FROM (VALUES
        ('STUDENT_READ', 'Schueler lesen'),
        ('STUDENT_WRITE', 'Schueler schreiben'),
        ('STUDENT_DELETE', 'Schueler loeschen')
      ) AS v(code, name)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'STUDENT_READ'
      WHERE r."is_system" = true
        AND r."system_code" IN
          ('ORG_OWNER', 'ORG_ADMIN', 'HR_MANAGER', 'OFFICE', 'TEAM_LEAD', 'EMPLOYEE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'STUDENT_WRITE'
      WHERE r."is_system" = true
        AND r."system_code" IN ('ORG_OWNER', 'ORG_ADMIN', 'OFFICE')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      JOIN "permissions" p ON p."code" = 'STUDENT_DELETE'
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
        WHERE "code" IN ('STUDENT_READ', 'STUDENT_WRITE', 'STUDENT_DELETE')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN ('STUDENT_READ', 'STUDENT_WRITE', 'STUDENT_DELETE')
    `);
  }
}
