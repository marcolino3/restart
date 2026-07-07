import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames the admission application's grade-level column from
 * `desired_grade_level_id` to `assigned_grade_level_id`. The level is set by
 * the school (an assignment), not requested by the parents — so "desired" was
 * the wrong semantics. The column may point at either a top-level Stufe or a
 * subgroup (Untergruppe); the parent chain derives the Stufe.
 *
 * Forward-only. `IF EXISTS` on the source guard keeps it idempotent so a DB
 * that already carries the renamed column is left untouched.
 */
export class RenameDesiredToAssignedGradeLevel1783061380000 implements MigrationInterface {
  name = 'RenameDesiredToAssignedGradeLevel1783061380000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_applications"
        RENAME COLUMN "desired_grade_level_id" TO "assigned_grade_level_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_applications"
        RENAME COLUMN "assigned_grade_level_id" TO "desired_grade_level_id"
    `);
  }
}
