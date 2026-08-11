import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Profile, billing and lifecycle columns for organizations. All "enum-like"
 * columns (school_type, plan, billing_interval, lifecycle_status) are plain
 * varchar validated against the TS enums in
 * packages/shared-schemas/src/organizations/organization-enums.ts, not PG
 * enum types — new values must not require a migration (CLAUDE.md 55P04
 * rule), mirrors organization_feature_toggles.feature_key.
 *
 * lifecycle_status is backfilled from the existing isActive column in the
 * same migration (no ALTER TYPE involved, so no 55P04 risk here).
 */
export class AddOrganizationProfileAndBillingFields1786400000000 implements MigrationInterface {
  name = 'AddOrganizationProfileAndBillingFields1786400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
        ADD COLUMN IF NOT EXISTS "short_code" varchar(8),
        ADD COLUMN IF NOT EXISTS "school_type" varchar(50),
        ADD COLUMN IF NOT EXISTS "legal_entity" varchar(200),
        ADD COLUMN IF NOT EXISTS "language" varchar(10) DEFAULT 'de-CH',
        ADD COLUMN IF NOT EXISTS "logo_url" varchar(500),
        ADD COLUMN IF NOT EXISTS "state" varchar(100),
        ADD COLUMN IF NOT EXISTS "billing_address_same_as_location" boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS "billing_address_extra" varchar(200),
        ADD COLUMN IF NOT EXISTS "contact_name" varchar(200),
        ADD COLUMN IF NOT EXISTS "contact_role" varchar(200),
        ADD COLUMN IF NOT EXISTS "contact_email" varchar(200),
        ADD COLUMN IF NOT EXISTS "contact_phone" varchar(50),
        ADD COLUMN IF NOT EXISTS "billing_email" varchar(200),
        ADD COLUMN IF NOT EXISTS "parent_mail_sender_email" varchar(200),
        ADD COLUMN IF NOT EXISTS "current_school_year" varchar(20),
        ADD COLUMN IF NOT EXISTS "active_levels" text[],
        ADD COLUMN IF NOT EXISTS "plan" varchar(30) DEFAULT 'STARTER',
        ADD COLUMN IF NOT EXISTS "user_license_limit" integer,
        ADD COLUMN IF NOT EXISTS "contract_ends_at" date,
        ADD COLUMN IF NOT EXISTS "billing_interval" varchar(20) DEFAULT 'YEARLY',
        ADD COLUMN IF NOT EXISTS "billing_amount_chf" numeric(10,2),
        ADD COLUMN IF NOT EXISTS "storage_limit_gb" integer,
        ADD COLUMN IF NOT EXISTS "lifecycle_status" varchar(20) DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS "trial_ends_at" date,
        ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "suspended_reason" varchar(500),
        ADD COLUMN IF NOT EXISTS "suspended_by_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
        ADD CONSTRAINT "fk_organizations_suspended_by"
        FOREIGN KEY ("suspended_by_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      UPDATE "organizations"
      SET "lifecycle_status" = CASE WHEN "isActive" THEN 'ACTIVE' ELSE 'SUSPENDED' END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "fk_organizations_suspended_by"`,
    );
    await queryRunner.query(`
      ALTER TABLE "organizations"
        DROP COLUMN IF EXISTS "short_code",
        DROP COLUMN IF EXISTS "school_type",
        DROP COLUMN IF EXISTS "legal_entity",
        DROP COLUMN IF EXISTS "language",
        DROP COLUMN IF EXISTS "logo_url",
        DROP COLUMN IF EXISTS "state",
        DROP COLUMN IF EXISTS "billing_address_same_as_location",
        DROP COLUMN IF EXISTS "billing_address_extra",
        DROP COLUMN IF EXISTS "contact_name",
        DROP COLUMN IF EXISTS "contact_role",
        DROP COLUMN IF EXISTS "contact_email",
        DROP COLUMN IF EXISTS "contact_phone",
        DROP COLUMN IF EXISTS "billing_email",
        DROP COLUMN IF EXISTS "parent_mail_sender_email",
        DROP COLUMN IF EXISTS "current_school_year",
        DROP COLUMN IF EXISTS "active_levels",
        DROP COLUMN IF EXISTS "plan",
        DROP COLUMN IF EXISTS "user_license_limit",
        DROP COLUMN IF EXISTS "contract_ends_at",
        DROP COLUMN IF EXISTS "billing_interval",
        DROP COLUMN IF EXISTS "billing_amount_chf",
        DROP COLUMN IF EXISTS "storage_limit_gb",
        DROP COLUMN IF EXISTS "lifecycle_status",
        DROP COLUMN IF EXISTS "trial_ends_at",
        DROP COLUMN IF EXISTS "suspended_at",
        DROP COLUMN IF EXISTS "suspended_reason",
        DROP COLUMN IF EXISTS "suspended_by_id"
    `);
  }
}
