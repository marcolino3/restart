import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Student master-data extension (Scope 1): additional identity / language /
 * registry fields on `students`, including `nationalities` as an ISO country
 * code array (text[]) — matching the project's country pattern (org `country`
 * and `CountryComboboxFormField` both use ISO codes) rather than a relation to
 * the unseeded `country` table.
 *
 * Forward-only / expand: all new columns are nullable. No destructive change
 * to existing rows. No enum ADD VALUE here (permission enum values live in a
 * separate migration).
 */
export class AddStudentMasterData1783061500000 implements MigrationInterface {
  name = 'AddStudentMasterData1783061500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD COLUMN IF NOT EXISTS "preferred_name" text,
        ADD COLUMN IF NOT EXISTS "place_of_birth" text,
        ADD COLUMN IF NOT EXISTS "first_languages" text[],
        ADD COLUMN IF NOT EXISTS "family_languages" text[],
        ADD COLUMN IF NOT EXISTS "religion" text,
        ADD COLUMN IF NOT EXISTS "social_security_number" text,
        ADD COLUMN IF NOT EXISTS "external_student_id" text,
        ADD COLUMN IF NOT EXISTS "nationalities" text[]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        DROP COLUMN IF EXISTS "nationalities",
        DROP COLUMN IF EXISTS "external_student_id",
        DROP COLUMN IF EXISTS "social_security_number",
        DROP COLUMN IF EXISTS "religion",
        DROP COLUMN IF EXISTS "family_languages",
        DROP COLUMN IF EXISTS "first_languages",
        DROP COLUMN IF EXISTS "place_of_birth",
        DROP COLUMN IF EXISTS "preferred_name"
    `);
  }
}
