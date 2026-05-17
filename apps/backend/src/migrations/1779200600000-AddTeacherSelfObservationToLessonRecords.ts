import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherSelfObservationToLessonRecords1779200600000
  implements MigrationInterface
{
  name = 'AddTeacherSelfObservationToLessonRecords1779200600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_teacher_preparation_enum') THEN
          CREATE TYPE "lesson_records_teacher_preparation_enum" AS ENUM (
            'WELL_PREPARED', 'ACCEPTABLE', 'RUSHED'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_room_mood_enum') THEN
          CREATE TYPE "lesson_records_room_mood_enum" AS ENUM (
            'CALM', 'FOCUSED', 'RESTLESS', 'DIFFICULT'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_teacher_stress_level_enum') THEN
          CREATE TYPE "lesson_records_teacher_stress_level_enum" AS ENUM (
            'RELAXED', 'NORMAL', 'STRESSED'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        ADD COLUMN IF NOT EXISTS "teacher_preparation" "lesson_records_teacher_preparation_enum",
        ADD COLUMN IF NOT EXISTS "room_mood" "lesson_records_room_mood_enum",
        ADD COLUMN IF NOT EXISTS "teacher_stress_level" "lesson_records_teacher_stress_level_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        DROP COLUMN IF EXISTS "teacher_stress_level",
        DROP COLUMN IF EXISTS "room_mood",
        DROP COLUMN IF EXISTS "teacher_preparation"
    `);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "lesson_records_teacher_stress_level_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "lesson_records_room_mood_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "lesson_records_teacher_preparation_enum"`,
    );
  }
}
