import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds three Hattie-/Montessori-inspired per-child observation axes to
 * `lesson_records`:
 *   - self_confidence (Hattie: self-efficacy)
 *   - persistence     (Hattie: persistence + help-seeking)
 *   - concentration   (Montessori: normalisation / flow)
 *
 * All columns are nullable — observation badges remain fully optional.
 */
export class AddSelfConfidencePersistenceConcentrationToLessonRecords1779200800000
  implements MigrationInterface
{
  name =
    'AddSelfConfidencePersistenceConcentrationToLessonRecords1779200800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_self_confidence_enum') THEN
          CREATE TYPE "lesson_records_self_confidence_enum" AS ENUM (
            'CONFIDENT', 'TENTATIVE', 'INSECURE'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_persistence_enum') THEN
          CREATE TYPE "lesson_records_persistence_enum" AS ENUM (
            'PERSISTS', 'SEEKS_HELP', 'GIVES_UP'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_records_concentration_enum') THEN
          CREATE TYPE "lesson_records_concentration_enum" AS ENUM (
            'FLOW', 'PARTIAL_FOCUS', 'INTERRUPTED'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        ADD COLUMN IF NOT EXISTS "self_confidence" "lesson_records_self_confidence_enum",
        ADD COLUMN IF NOT EXISTS "persistence" "lesson_records_persistence_enum",
        ADD COLUMN IF NOT EXISTS "concentration" "lesson_records_concentration_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        DROP COLUMN IF EXISTS "concentration",
        DROP COLUMN IF EXISTS "persistence",
        DROP COLUMN IF EXISTS "self_confidence"
    `);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "lesson_records_concentration_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "lesson_records_persistence_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "lesson_records_self_confidence_enum"`,
    );
  }
}
