import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Puts the child's grade level on the enrolment.
 *
 * Until now a stage could only be reached through the class, so a class
 * spanning several stages ("Unterstufe" with US1–US3) could not say which
 * child sits in which subgroup. The admission process had the information
 * (admission_applications.assigned_grade_level_id) and dropped it the moment
 * the application became a student.
 *
 * On the enrolment rather than on the student, so it follows the class
 * assignment: a child moving to another class next August gets a new
 * enrolment row and a new subgroup, while the closed row keeps the old one —
 * that is what makes "which subgroup was this child in last year" answerable.
 *
 * Nullable on purpose: a class does not have to use subgroups, and an
 * existing enrolment has no way of knowing which one would be right. The
 * column stays empty until somebody assigns it.
 */
export class AddEnrollmentGradeLevel1783090000000
  implements MigrationInterface
{
  name = 'AddEnrollmentGradeLevel1783090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "school_class_enrollments"
        ADD COLUMN IF NOT EXISTS "grade_level_id" uuid
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "school_class_enrollments"
          ADD CONSTRAINT "fk_enrollment_grade_level"
          FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id")
          ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Drives the kanban, which groups a class's enrolments by subgroup.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollment_grade_level"
        ON "school_class_enrollments" ("grade_level_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_enrollment_grade_level"`,
    );
    await queryRunner.query(`
      ALTER TABLE "school_class_enrollments"
        DROP CONSTRAINT IF EXISTS "fk_enrollment_grade_level",
        DROP COLUMN IF EXISTS "grade_level_id"
    `);
  }
}
