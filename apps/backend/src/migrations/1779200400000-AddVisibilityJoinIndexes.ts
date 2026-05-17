import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the indexes that `StudentsService.findVisibleByUser` and
 * `assertStudentVisibleToUser` rely on. The original entities defined
 * neither the membership lookup indexes nor an employee-side index on
 * the auto-generated `school_class_teachers` join table, so every
 * teacher-scoped student-list load triggered sequential scans on
 * `memberships` and `school_class_teachers` — the main reason that
 * page felt slow.
 */
export class AddVisibilityJoinIndexes1779200400000
  implements MigrationInterface
{
  name = 'AddVisibilityJoinIndexes1779200400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_memberships_user"
         ON "memberships" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_memberships_employee"
         ON "memberships" ("employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_memberships_org"
         ON "memberships" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_school_class_teachers_employee"
         ON "school_class_teachers" ("employee_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_school_class_teachers_employee"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_memberships_org"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_memberships_employee"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_memberships_user"`);
  }
}
