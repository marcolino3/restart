import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-organization feature toggles (time tracking, projects, my tasks,
 * chats, record keeping). `feature_key` is a plain varchar validated
 * against the TS catalog in
 * packages/shared-schemas/src/org-features/feature-catalog.ts, not a PG
 * enum — new feature keys must not require a migration (see CLAUDE.md
 * 55P04 rule), mirrors role_field_permissions.resource/field.
 *
 * Seeds one enabled=true row per (organization, feature) for all existing
 * organizations so OrgFeatureGuard can require an explicit row instead of
 * defaulting missing rows to enabled.
 */
export class CreateOrganizationFeatureToggles1786300000000 implements MigrationInterface {
  name = 'CreateOrganizationFeatureToggles1786300000000';

  private readonly featureKeys = [
    'TIME_TRACKING',
    'PROJECTS',
    'MY_TASKS',
    'CHATS',
    'PROTOCOLS',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_feature_toggles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "feature_key" varchar(100) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "changed_by" uuid,
        CONSTRAINT "pk_organization_feature_toggles" PRIMARY KEY ("id"),
        CONSTRAINT "fk_org_feature_toggles_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_org_feature_toggles_changed_by" FOREIGN KEY ("changed_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_org_feature_toggles_org_feature" ON "organization_feature_toggles" ("organization_id", "feature_key")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_org_feature_toggles_org" ON "organization_feature_toggles" ("organization_id")`,
    );

    const organizations: { id: string }[] = await queryRunner.query(
      `SELECT "id" FROM "organizations"`,
    );
    for (const org of organizations) {
      for (const featureKey of this.featureKeys) {
        await queryRunner.query(
          `INSERT INTO "organization_feature_toggles" ("organization_id", "feature_key", "enabled")
           VALUES ($1, $2, true)
           ON CONFLICT ("organization_id", "feature_key") DO NOTHING`,
          [org.id, featureKey],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "organization_feature_toggles"`,
    );
  }
}
