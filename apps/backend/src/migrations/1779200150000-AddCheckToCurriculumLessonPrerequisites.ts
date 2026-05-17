import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Wenn die curriculum_lesson_prerequisites-Tabelle initial via
 * TypeORM-Auto-Sync entstand (DB_SYNCHRONIZE=true), fehlt der
 * Self-Reference-CHECK. Diese Migration ergänzt ihn idempotent.
 */
export class AddCheckToCurriculumLessonPrerequisites1779200150000
  implements MigrationInterface
{
  name = 'AddCheckToCurriculumLessonPrerequisites1779200150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "curriculum_lesson_prerequisites"
      DROP CONSTRAINT IF EXISTS "chk_clp_no_self_reference"
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum_lesson_prerequisites"
      ADD CONSTRAINT "chk_clp_no_self_reference"
      CHECK ("lesson_id" <> "prerequisite_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "curriculum_lesson_prerequisites"
      DROP CONSTRAINT IF EXISTS "chk_clp_no_self_reference"
    `);
  }
}
