import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Splits two overloaded organization columns into their real dimensions.
 *
 * school_type used to mix pedagogy (MONTESSORI, FREIE_SCHULE), care model
 * (TAGESSCHULE) and education level (KINDERGARTEN_CASA), so none of the three
 * was evaluable. It now carries pedagogy only; care_model and the pre-existing
 * active_levels array take the other two, and sponsorship (public/private/…)
 * is added as the fourth, previously missing dimension.
 *
 * contact_name was a single free-text field and becomes salutation + title +
 * first/last name, mirroring the ContactPerson entity.
 *
 * All "enum-like" columns stay plain varchar validated against the TS enums in
 * packages/shared-schemas/src/organizations/organization-enums.ts, not PG enum
 * types — new values must not require a migration (CLAUDE.md 55P04 rule).
 *
 * Dropped without replacement: "state" (canton) — no longer collected. down()
 * recreates the column but cannot restore its values.
 */
export class SplitOrganizationClassificationAndContact1786600000000 implements MigrationInterface {
  name = 'SplitOrganizationClassificationAndContact1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
        ADD COLUMN IF NOT EXISTS "sponsorship" varchar(50),
        ADD COLUMN IF NOT EXISTS "care_model" varchar(50),
        ADD COLUMN IF NOT EXISTS "contact_salutation" varchar(20),
        ADD COLUMN IF NOT EXISTS "contact_title" varchar(50),
        ADD COLUMN IF NOT EXISTS "contact_first_name" varchar(100),
        ADD COLUMN IF NOT EXISTS "contact_last_name" varchar(100)
    `);

    // Move the two misplaced school_type values to their new home before the
    // value list is narrowed to pedagogy.
    await queryRunner.query(`
      UPDATE "organizations"
      SET "care_model" = 'TAGESSCHULE'
      WHERE "school_type" = 'TAGESSCHULE' AND "care_model" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "organizations"
      SET "active_levels" = ARRAY['KINDERGARTEN_CASA']::text[]
      WHERE "school_type" = 'KINDERGARTEN_CASA'
        AND ("active_levels" IS NULL OR cardinality("active_levels") = 0)
    `);
    await queryRunner.query(`
      UPDATE "organizations"
      SET "school_type" = NULL
      WHERE "school_type" IN ('TAGESSCHULE', 'KINDERGARTEN_CASA')
    `);

    // Split on the last space: everything before it is the first name. Without
    // a space the whole value is the last name, which is the safer guess for a
    // single token.
    await queryRunner.query(`
      UPDATE "organizations"
      SET
        "contact_first_name" = NULLIF(
          substring(btrim("contact_name") from '^(.*)\\s\\S+$'), ''
        ),
        "contact_last_name" = substring(btrim("contact_name") from '(\\S+)$')
      WHERE "contact_name" IS NOT NULL AND btrim("contact_name") <> ''
    `);

    // active_levels and language were never validated element-wise; clear
    // values outside the new lists so later updates do not fail validation.
    await queryRunner.query(`
      UPDATE "organizations"
      SET "active_levels" = NULL
      WHERE "active_levels" IS NOT NULL
        AND NOT ("active_levels" <@ ARRAY[
          'KINDERGARTEN_CASA', 'PRIMARSTUFE', 'SEKUNDARSTUFE_I', 'SEKUNDARSTUFE_II'
        ]::text[])
    `);
    await queryRunner.query(`
      UPDATE "organizations"
      SET "language" = 'de-CH'
      WHERE "language" IS NOT NULL
        AND "language" NOT IN ('de-CH', 'de-DE', 'de-AT', 'fr-CH', 'it-CH', 'en-GB')
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
        DROP COLUMN IF EXISTS "state",
        DROP COLUMN IF EXISTS "contact_name"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
        ADD COLUMN IF NOT EXISTS "state" varchar(100),
        ADD COLUMN IF NOT EXISTS "contact_name" varchar(200)
    `);

    await queryRunner.query(`
      UPDATE "organizations"
      SET "contact_name" = btrim(
        concat_ws(' ', "contact_first_name", "contact_last_name")
      )
      WHERE "contact_first_name" IS NOT NULL OR "contact_last_name" IS NOT NULL
    `);

    // Move the care model back into school_type where it came from.
    await queryRunner.query(`
      UPDATE "organizations"
      SET "school_type" = 'TAGESSCHULE'
      WHERE "care_model" = 'TAGESSCHULE' AND "school_type" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
        DROP COLUMN IF EXISTS "sponsorship",
        DROP COLUMN IF EXISTS "care_model",
        DROP COLUMN IF EXISTS "contact_salutation",
        DROP COLUMN IF EXISTS "contact_title",
        DROP COLUMN IF EXISTS "contact_first_name",
        DROP COLUMN IF EXISTS "contact_last_name"
    `);
  }
}
