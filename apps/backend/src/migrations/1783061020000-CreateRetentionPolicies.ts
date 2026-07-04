import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Org-configurable retention policies (Aufbewahrungsfristen, DSGVO Art. 5(1)(e))
 * — one per (org, entity_type). Execution is deliberately separate (an
 * admin-reviewed purge job, DSG-07); this only stores the rules.
 *
 * Each enum column gets its OWN pg type. Registers the RETENTION_* permission
 * codes; catalog + role rows are seeded in the next migration (55P04).
 */
export class CreateRetentionPolicies1783061020000
  implements MigrationInterface
{
  name = 'CreateRetentionPolicies1783061020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."retention_policies_entity_type_enum" AS ENUM('STUDENT', 'EMPLOYEE', 'CONTACT_PERSON', 'ADMISSION_APPLICATION', 'DATA_SUBJECT_REQUEST')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."retention_policies_action_enum" AS ENUM('DELETE', 'ANONYMIZE')`,
    );

    await queryRunner.query(
      `CREATE TABLE "retention_policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "entity_type" "public"."retention_policies_entity_type_enum" NOT NULL, "retention_months" integer NOT NULL, "action" "public"."retention_policies_action_enum" NOT NULL DEFAULT 'ANONYMIZE', "description" text, "is_enabled" boolean NOT NULL DEFAULT true, "organization_id" uuid NOT NULL, CONSTRAINT "PK_retention_policies" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_retention_policies_org" ON "retention_policies" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_retention_policy_org_entity" ON "retention_policies" ("organization_id", "entity_type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "retention_policies" ADD CONSTRAINT "FK_retention_policies_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // --- Permission codes (values only; seeded in the next migration) ---
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'RETENTION_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'RETENTION_MANAGE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "retention_policies"`);
    await queryRunner.query(
      `DROP TYPE "public"."retention_policies_action_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."retention_policies_entity_type_enum"`,
    );
  }
}
