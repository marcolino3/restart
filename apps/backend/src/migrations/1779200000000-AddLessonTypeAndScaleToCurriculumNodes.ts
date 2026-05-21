import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonTypeAndScaleToCurriculumNodes1779200000000 implements MigrationInterface {
  name = 'AddLessonTypeAndScaleToCurriculumNodes1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'curriculum_nodes_lesson_type_enum') THEN
          CREATE TYPE "curriculum_nodes_lesson_type_enum" AS ENUM (
            'P', 'THREE_PL', 'E', 'M', 'S'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'curriculum_nodes_lesson_scale_enum') THEN
          CREATE TYPE "curriculum_nodes_lesson_scale_enum" AS ENUM (
            'MASTERABLE', 'ONGOING'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      ALTER TABLE "curriculum_nodes"
      ADD COLUMN IF NOT EXISTS "lesson_type" "curriculum_nodes_lesson_type_enum" NULL,
      ADD COLUMN IF NOT EXISTS "lesson_scale" "curriculum_nodes_lesson_scale_enum" NULL
    `);

    // Constraint: lesson_type / lesson_scale dürfen nur für node_type='LESSON' gesetzt sein.
    await queryRunner.query(`
      ALTER TABLE "curriculum_nodes"
      DROP CONSTRAINT IF EXISTS "chk_curriculum_nodes_lesson_attrs_only_for_lesson"
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum_nodes"
      ADD CONSTRAINT "chk_curriculum_nodes_lesson_attrs_only_for_lesson"
      CHECK (
        node_type = 'LESSON'
        OR (lesson_type IS NULL AND lesson_scale IS NULL)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "curriculum_nodes"
      DROP CONSTRAINT IF EXISTS "chk_curriculum_nodes_lesson_attrs_only_for_lesson"
    `);
    await queryRunner.query(`
      ALTER TABLE "curriculum_nodes"
      DROP COLUMN IF EXISTS "lesson_scale",
      DROP COLUMN IF EXISTS "lesson_type"
    `);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "curriculum_nodes_lesson_scale_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "curriculum_nodes_lesson_type_enum"`,
    );
  }
}
