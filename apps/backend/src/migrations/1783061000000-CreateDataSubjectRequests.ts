import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Data-subject requests (Betroffenenanfragen) tracked to their statutory
 * deadline (received + 1 month). Org-scoped; `subject_id` optionally links a
 * system record while `subject_name` always holds the human label.
 *
 * Each enum column gets its OWN pg type (never share a type across columns —
 * see MEMORY "TypeORM-Sync shared enums"). Registers the two DATA_REQUEST_*
 * permission codes; catalog + role rows are seeded in the next migration
 * (new enum values cannot be used in the same transaction — 55P04).
 */
export class CreateDataSubjectRequests1783061000000 implements MigrationInterface {
  name = 'CreateDataSubjectRequests1783061000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."data_subject_requests_request_type_enum" AS ENUM('ACCESS', 'RECTIFICATION', 'ERASURE', 'PORTABILITY', 'OBJECTION', 'RESTRICTION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."data_subject_requests_status_enum" AS ENUM('NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."data_subject_requests_subject_type_enum" AS ENUM('STUDENT', 'EMPLOYEE', 'CONTACT_PERSON', 'OTHER')`,
    );

    await queryRunner.query(
      `CREATE TABLE "data_subject_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "request_type" "public"."data_subject_requests_request_type_enum" NOT NULL, "status" "public"."data_subject_requests_status_enum" NOT NULL DEFAULT 'NEW', "subject_type" "public"."data_subject_requests_subject_type_enum" NOT NULL DEFAULT 'OTHER', "subject_id" uuid, "subject_name" text NOT NULL, "contact_email" text, "received_at" date NOT NULL, "due_date" date NOT NULL, "assignee_membership_id" uuid, "resolved_at" TIMESTAMP WITH TIME ZONE, "resolution_note" text, "notes" text, "created_by_membership_id" uuid, "organization_id" uuid NOT NULL, CONSTRAINT "PK_data_subject_requests" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_subject_requests_org" ON "data_subject_requests" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_subject_requests_status" ON "data_subject_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_subject_requests_due" ON "data_subject_requests" ("due_date") `,
    );

    await queryRunner.query(
      `ALTER TABLE "data_subject_requests" ADD CONSTRAINT "FK_dsr_assignee_membership" FOREIGN KEY ("assignee_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_subject_requests" ADD CONSTRAINT "FK_dsr_created_by_membership" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_subject_requests" ADD CONSTRAINT "FK_dsr_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // --- Permission codes (values only; seeded in the next migration) ---
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'DATA_REQUEST_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'DATA_REQUEST_MANAGE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "data_subject_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."data_subject_requests_subject_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."data_subject_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."data_subject_requests_request_type_enum"`,
    );
  }
}
