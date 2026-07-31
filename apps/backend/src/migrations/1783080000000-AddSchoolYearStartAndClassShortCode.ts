import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * School year without a SchoolYear entity, plus the class short code.
 *
 * The school year is derived, not stored: an organisation configures the day
 * its year starts (1 August by default) and every "Schuljahr 2026/27" label
 * follows from a date. That keeps classes timeless — nobody has to create a
 * new school year each August, and historical class lists come from the
 * validity ranges on the assignments instead.
 *
 * It also suits the billing that is planned later: invoices rarely align to
 * whole years (mid-term entry, an add-on starting in May, a workload change
 * in February), so date intervals are the useful primitive. A year label is
 * then just a range to overlap against.
 *
 * Forward-only / expand: both columns carry defaults, so existing rows stay
 * valid.
 */
export class AddSchoolYearStartAndClassShortCode1783080000000 implements MigrationInterface {
  name = 'AddSchoolYearStartAndClassShortCode1783080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
        ADD COLUMN IF NOT EXISTS "school_year_start_month" smallint NOT NULL DEFAULT 8,
        ADD COLUMN IF NOT EXISTS "school_year_start_day" smallint NOT NULL DEFAULT 1
    `);

    // Guard against nonsense values reaching the date maths.
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "organizations"
          ADD CONSTRAINT "chk_organizations_school_year_start"
          CHECK (
            "school_year_start_month" BETWEEN 1 AND 12
            AND "school_year_start_day" BETWEEN 1 AND 28
          );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "school_classes"
        ADD COLUMN IF NOT EXISTS "short_code" varchar(16)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "school_classes" DROP COLUMN IF EXISTS "short_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "chk_organizations_school_year_start"`,
    );
    await queryRunner.query(`
      ALTER TABLE "organizations"
        DROP COLUMN IF EXISTS "school_year_start_day",
        DROP COLUMN IF EXISTS "school_year_start_month"
    `);
  }
}
