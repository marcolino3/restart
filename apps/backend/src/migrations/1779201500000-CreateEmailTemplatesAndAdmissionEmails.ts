import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailTemplatesAndAdmissionEmails1779201500000 implements MigrationInterface {
  name = 'CreateEmailTemplatesAndAdmissionEmails1779201500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum types (idempotent guards, matching TypeORM's derived type names).
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "email_templates_category_enum" AS ENUM ('ADMISSION', 'GENERAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "admission_emails_status_enum" AS ENUM ('SENT', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Reusable, org-scoped email templates.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_templates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "category" "email_templates_category_enum" NOT NULL DEFAULT 'ADMISSION',
        "subject" character varying(300) NOT NULL,
        "body_html" text NOT NULL,
        "description" text,
        "created_by_membership_id" uuid,
        CONSTRAINT "pk_email_templates" PRIMARY KEY ("id"),
        CONSTRAINT "fk_email_templates_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_email_templates_created_by"
          FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_email_templates_org" ON "email_templates" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_email_templates_org_category" ON "email_templates" ("organization_id", "category")`,
    );

    // Tracked outbound admission emails (incl. delivery status).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_emails" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "template_id" uuid,
        "to_email" character varying(320) NOT NULL,
        "to_name" character varying(200),
        "subject" character varying(300) NOT NULL,
        "body_html" text NOT NULL,
        "status" "admission_emails_status_enum" NOT NULL,
        "error_message" text,
        "provider_message_id" character varying(998),
        "sent_by_membership_id" uuid,
        "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pk_admission_emails" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_emails_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_emails_application"
          FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_emails_template"
          FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_admission_emails_sent_by"
          FOREIGN KEY ("sent_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_emails_org" ON "admission_emails" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_emails_app_sent" ON "admission_emails" ("application_id", "sent_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_emails"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_templates"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admission_emails_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "email_templates_category_enum"`,
    );
  }
}
