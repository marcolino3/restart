import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHattieObservationsToLessonRecords1779200500000
  implements MigrationInterface
{
  name = 'AddHattieObservationsToLessonRecords1779200500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_engagement_enum') THEN
          CREATE TYPE "lesson_records_engagement_enum" AS ENUM (
            'FOCUSED', 'INTERESTED', 'DUTIFUL', 'RESISTANT'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_difficulty_enum') THEN
          CREATE TYPE "lesson_records_difficulty_enum" AS ENUM (
            'TOO_EASY', 'JUST_RIGHT', 'TOO_HARD'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_social_form_enum') THEN
          CREATE TYPE "lesson_records_social_form_enum" AS ENUM (
            'ALONE', 'WITH_PARTNER', 'SMALL_GROUP', 'WITH_GUIDE'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_self_assessment_enum') THEN
          CREATE TYPE "lesson_records_self_assessment_enum" AS ENUM (
            'UNDERSTOOD', 'PARTIAL', 'NEEDS_REPEAT'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        ADD COLUMN IF NOT EXISTS "engagement" "lesson_records_engagement_enum",
        ADD COLUMN IF NOT EXISTS "difficulty" "lesson_records_difficulty_enum",
        ADD COLUMN IF NOT EXISTS "social_form" "lesson_records_social_form_enum",
        ADD COLUMN IF NOT EXISTS "self_assessment" "lesson_records_self_assessment_enum",
        ADD COLUMN IF NOT EXISTS "self_assessment_by_child" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "lesson_clarity_confirmed" boolean
    `);

    // Sanity: self_assessment_by_child=true setzt voraus, dass self_assessment gesetzt ist.
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        ADD CONSTRAINT "chk_lesson_records_self_assessment_source"
        CHECK (
          self_assessment_by_child = false
          OR self_assessment IS NOT NULL
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        DROP CONSTRAINT IF EXISTS "chk_lesson_records_self_assessment_source"
    `);
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        DROP COLUMN IF EXISTS "lesson_clarity_confirmed",
        DROP COLUMN IF EXISTS "self_assessment_by_child",
        DROP COLUMN IF EXISTS "self_assessment",
        DROP COLUMN IF EXISTS "social_form",
        DROP COLUMN IF EXISTS "difficulty",
        DROP COLUMN IF EXISTS "engagement"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_records_self_assessment_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_records_social_form_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_records_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lesson_records_engagement_enum"`);
  }
}
