import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Consent management (Einwilligungen). Three tables:
 *  - consent_purposes: org-configurable catalogue of what consent is asked for
 *  - consents: the current GRANTED/DENIED/WITHDRAWN decision per purpose×subject
 *  - consent_audit_logs: append-only proof trail (denormalized, no FK to consents)
 *
 * Every enum column gets its OWN pg type (never share a type across columns/tables
 * — a shared enum type crashes the local boot; see MEMORY "TypeORM-Sync shared enums").
 *
 * Registers the three CONSENT_* permission codes on the existing enum; catalog
 * rows + role assignments are seeded in BackfillConsentPermissions (new enum
 * values cannot be used in the same transaction they are added in — 55P04).
 */
export class CreateConsent1783060970000 implements MigrationInterface {
  name = 'CreateConsent1783060970000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Enum types (one per column) ---
    await queryRunner.query(
      `CREATE TYPE "public"."consent_purposes_applies_to_enum" AS ENUM('STUDENT', 'EMPLOYEE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consent_purposes_legal_basis_enum" AS ENUM('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTEREST', 'PUBLIC_TASK', 'LEGITIMATE_INTEREST')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consents_subject_type_enum" AS ENUM('STUDENT', 'EMPLOYEE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consents_status_enum" AS ENUM('GRANTED', 'DENIED', 'WITHDRAWN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consent_audit_logs_subject_type_enum" AS ENUM('STUDENT', 'EMPLOYEE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consent_audit_logs_action_enum" AS ENUM('GRANTED', 'DENIED', 'WITHDRAWN', 'UPDATED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consent_audit_logs_previous_status_enum" AS ENUM('GRANTED', 'DENIED', 'WITHDRAWN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consent_audit_logs_new_status_enum" AS ENUM('GRANTED', 'DENIED', 'WITHDRAWN')`,
    );

    // --- consent_purposes ---
    await queryRunner.query(
      `CREATE TABLE "consent_purposes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text NOT NULL, "slug" text NOT NULL, "description" text, "applies_to" "public"."consent_purposes_applies_to_enum"[] NOT NULL DEFAULT '{}', "legal_basis" "public"."consent_purposes_legal_basis_enum" NOT NULL DEFAULT 'CONSENT', "requires_evidence" boolean NOT NULL DEFAULT false, "is_mandatory" boolean NOT NULL DEFAULT false, "position" integer NOT NULL DEFAULT 0, "organization_id" uuid NOT NULL, CONSTRAINT "PK_consent_purposes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_consent_purposes_org" ON "consent_purposes" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_consent_purpose_org_slug" ON "consent_purposes" ("organization_id", "slug") `,
    );

    // --- consents ---
    await queryRunner.query(
      `CREATE TABLE "consents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "subject_type" "public"."consents_subject_type_enum" NOT NULL, "subject_id" uuid NOT NULL, "purpose_id" uuid NOT NULL, "status" "public"."consents_status_enum" NOT NULL, "granted_by_contact_person_id" uuid, "actor_membership_id" uuid, "decided_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "withdrawn_at" TIMESTAMP WITH TIME ZONE, "evidence_url" text, "note" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_consents" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_consents_org" ON "consents" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_consents_subject" ON "consents" ("subject_type", "subject_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_consent_org_purpose_subject" ON "consents" ("organization_id", "purpose_id", "subject_type", "subject_id") `,
    );

    // --- consent_audit_logs ---
    await queryRunner.query(
      `CREATE TABLE "consent_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "consent_id" uuid, "purpose_id" uuid NOT NULL, "subject_type" "public"."consent_audit_logs_subject_type_enum" NOT NULL, "subject_id" uuid NOT NULL, "action" "public"."consent_audit_logs_action_enum" NOT NULL, "previous_status" "public"."consent_audit_logs_previous_status_enum", "new_status" "public"."consent_audit_logs_new_status_enum", "actor_membership_id" uuid, "note" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_consent_audit_logs" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_consent_audit_logs_org" ON "consent_audit_logs" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_consent_audit_logs_subject" ON "consent_audit_logs" ("subject_type", "subject_id") `,
    );

    // --- Foreign keys ---
    await queryRunner.query(
      `ALTER TABLE "consent_purposes" ADD CONSTRAINT "FK_consent_purposes_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consents" ADD CONSTRAINT "FK_consents_purpose" FOREIGN KEY ("purpose_id") REFERENCES "consent_purposes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consents" ADD CONSTRAINT "FK_consents_contact_person" FOREIGN KEY ("granted_by_contact_person_id") REFERENCES "contact_persons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consents" ADD CONSTRAINT "FK_consents_actor_membership" FOREIGN KEY ("actor_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consents" ADD CONSTRAINT "FK_consents_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consent_audit_logs" ADD CONSTRAINT "FK_consent_audit_logs_actor_membership" FOREIGN KEY ("actor_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consent_audit_logs" ADD CONSTRAINT "FK_consent_audit_logs_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // --- Permission codes (values only; seeded in the next migration) ---
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'CONSENT_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'CONSENT_MANAGE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'CONSENT_SETTINGS_MANAGE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "consent_audit_logs"`);
    await queryRunner.query(`DROP TABLE "consents"`);
    await queryRunner.query(`DROP TABLE "consent_purposes"`);
    await queryRunner.query(
      `DROP TYPE "public"."consent_audit_logs_new_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."consent_audit_logs_previous_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."consent_audit_logs_action_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."consent_audit_logs_subject_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."consents_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."consents_subject_type_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."consent_purposes_legal_basis_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."consent_purposes_applies_to_enum"`,
    );
  }
}
