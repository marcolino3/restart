import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Student master-data extension (Scope 1): additional identity / language /
 * registry fields on `students`, plus a `student_nationalities` M:N join table
 * to the global `country` table.
 *
 * Forward-only / expand: all new columns are nullable, the join table is new.
 * No destructive change to existing rows. No enum ADD VALUE here (permission
 * enum values live in a separate migration).
 */
export class AddStudentMasterData1783061500000 implements MigrationInterface {
  name = 'AddStudentMasterData1783061500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // New scalar columns on students.
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD COLUMN IF NOT EXISTS "preferred_name" text,
        ADD COLUMN IF NOT EXISTS "place_of_birth" text,
        ADD COLUMN IF NOT EXISTS "first_languages" text[],
        ADD COLUMN IF NOT EXISTS "family_languages" text[],
        ADD COLUMN IF NOT EXISTS "religion" text,
        ADD COLUMN IF NOT EXISTS "social_security_number" text,
        ADD COLUMN IF NOT EXISTS "external_student_id" text
    `);

    // M:N join students <-> country (nationalities). Plain pair table (no
    // AbstractEntity columns) since it maps a @ManyToMany without a join entity.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_nationalities" (
        "student_id" uuid NOT NULL,
        "country_id" uuid NOT NULL,
        CONSTRAINT "pk_student_nationalities"
          PRIMARY KEY ("student_id", "country_id"),
        CONSTRAINT "fk_student_nationalities_student"
          FOREIGN KEY ("student_id") REFERENCES "students"("id")
          ON DELETE CASCADE,
        CONSTRAINT "fk_student_nationalities_country"
          FOREIGN KEY ("country_id") REFERENCES "country"("id")
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_nationalities_student"
        ON "student_nationalities" ("student_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_nationalities_country"
        ON "student_nationalities" ("country_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_student_nationalities_country"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_student_nationalities_student"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "student_nationalities"`);
    await queryRunner.query(`
      ALTER TABLE "students"
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
