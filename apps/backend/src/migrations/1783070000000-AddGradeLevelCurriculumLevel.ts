import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Links a school stage (grade_levels) to a curriculum cycle
 * (curriculum_levels, shown as "Zyklus"/"Cycle" in the UI).
 *
 * Without it there is no way to tell which lessons belong to a child: the
 * progress entry screen loads every LESSON node of the organisation. The
 * chain child -> enrolment -> class -> stage already exists; this closes the
 * last hop stage -> cycle.
 *
 * Forward-only / expand: nullable column, FK ON DELETE SET NULL. Stages
 * without a cycle keep working — the lesson list simply stays unfiltered for
 * them, so an incomplete setup never blocks recording progress.
 */
export class AddGradeLevelCurriculumLevel1783070000000 implements MigrationInterface {
  name = 'AddGradeLevelCurriculumLevel1783070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "grade_levels"
        ADD COLUMN IF NOT EXISTS "curriculum_level_id" uuid
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "grade_levels"
          ADD CONSTRAINT "fk_grade_levels_curriculum_level"
          FOREIGN KEY ("curriculum_level_id") REFERENCES "curriculum_levels"("id")
          ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_grade_levels_curriculum_level"
        ON "grade_levels" ("curriculum_level_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_grade_levels_curriculum_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_levels" DROP CONSTRAINT IF EXISTS "fk_grade_levels_curriculum_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_levels" DROP COLUMN IF EXISTS "curriculum_level_id"`,
    );
  }
}
