import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Data-breach incidents (Datenpannen) with the guided notification workflow
 * (DSGVO Art. 33/34 / revDSG). `detected_at` starts the 72h authority clock;
 * `authority_notified_at` / `subjects_notified_at` record that each obligation
 * was met. Org-scoped.
 *
 * Each enum column gets its OWN pg type. Registers the DATA_BREACH_* permission
 * codes; catalog + role rows are seeded in the next migration (55P04).
 */
export class CreateDataBreaches1783061040000 implements MigrationInterface {
  name = 'CreateDataBreaches1783061040000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."data_breach_incidents_status_enum" AS ENUM('OPEN', 'INVESTIGATING', 'CONTAINED', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."data_breach_incidents_risk_level_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`,
    );

    await queryRunner.query(
      `CREATE TABLE "data_breach_incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "title" text NOT NULL, "description" text NOT NULL, "detected_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" "public"."data_breach_incidents_status_enum" NOT NULL DEFAULT 'OPEN', "risk_level" "public"."data_breach_incidents_risk_level_enum" NOT NULL DEFAULT 'MEDIUM', "affected_scope" text, "affected_count" integer, "authority_notified_at" TIMESTAMP WITH TIME ZONE, "subjects_notified_at" TIMESTAMP WITH TIME ZONE, "measures" text, "assignee_membership_id" uuid, "created_by_membership_id" uuid, "closed_at" TIMESTAMP WITH TIME ZONE, "notes" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_data_breach_incidents" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_breach_incidents_org" ON "data_breach_incidents" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_breach_incidents_status" ON "data_breach_incidents" ("status") `,
    );

    await queryRunner.query(
      `ALTER TABLE "data_breach_incidents" ADD CONSTRAINT "FK_breach_assignee_membership" FOREIGN KEY ("assignee_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_breach_incidents" ADD CONSTRAINT "FK_breach_created_by_membership" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_breach_incidents" ADD CONSTRAINT "FK_breach_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // --- Permission codes (values only; seeded in the next migration) ---
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'DATA_BREACH_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'DATA_BREACH_MANAGE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "data_breach_incidents"`);
    await queryRunner.query(
      `DROP TYPE "public"."data_breach_incidents_risk_level_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."data_breach_incidents_status_enum"`,
    );
  }
}
