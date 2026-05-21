import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCurriculumLessonPrerequisites1779200100000 implements MigrationInterface {
  name = 'CreateCurriculumLessonPrerequisites1779200100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabelle entsteht bei aktiviertem DB_SYNCHRONIZE bereits aus dem
    // @JoinTable() der CurriculumNode-Entity — daher idempotent halten.
    // organization_id ist hier NICHT gespeichert: beide FKs zeigen auf
    // curriculum_nodes, die selbst organisationsgebunden sind. Der
    // Cross-Org-Schutz passiert im Service (assertLessonInOrg + Prerequisite-Validation).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "curriculum_lesson_prerequisites" (
        "lesson_id" uuid NOT NULL,
        "prerequisite_id" uuid NOT NULL,
        CONSTRAINT "pk_curriculum_lesson_prerequisites"
          PRIMARY KEY ("lesson_id", "prerequisite_id"),
        CONSTRAINT "fk_clp_lesson"
          FOREIGN KEY ("lesson_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_clp_prerequisite"
          FOREIGN KEY ("prerequisite_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "curriculum_lesson_prerequisites"
      DROP CONSTRAINT IF EXISTS "chk_clp_no_self_reference"
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum_lesson_prerequisites"
      ADD CONSTRAINT "chk_clp_no_self_reference"
      CHECK ("lesson_id" <> "prerequisite_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clp_lesson" ON "curriculum_lesson_prerequisites" ("lesson_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_clp_prerequisite" ON "curriculum_lesson_prerequisites" ("prerequisite_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "curriculum_lesson_prerequisites"`,
    );
  }
}
