import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Audit trail for superadmin actions on an organization (feature toggles,
 * plan changes, suspend/reactivate, support impersonation, data export).
 * `action` is a plain varchar validated against the TS enum in
 * packages/shared-schemas/src/organizations/organization-enums.ts, not a PG
 * enum — new actions must not require a migration (CLAUDE.md 55P04 rule),
 * mirrors organization_feature_toggles.feature_key.
 */
export class CreateOrganizationAuditLogs1786400100000 implements MigrationInterface {
  name = 'CreateOrganizationAuditLogs1786400100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "actor_user_id" uuid,
        "action" varchar(50) NOT NULL,
        "payload" jsonb,
        CONSTRAINT "pk_organization_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_org_audit_logs_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_org_audit_logs_actor" FOREIGN KEY ("actor_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_org_audit_logs_org_created" ON "organization_audit_logs" ("organization_id", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_audit_logs"`);
  }
}
