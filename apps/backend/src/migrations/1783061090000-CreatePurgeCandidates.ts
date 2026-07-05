import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Retention purge candidates (DSG-07). Records flagged by the retention scan as
 * past their retention period; each must be APPROVED by an admin before its
 * DELETE/ANONYMIZE action runs. Access reuses RETENTION_MANAGE — no new
 * permission. Each enum column gets its own pg type.
 */
export class CreatePurgeCandidates1783061090000 implements MigrationInterface {
  name = 'CreatePurgeCandidates1783061090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."purge_candidates_entity_type_enum" AS ENUM('STUDENT', 'EMPLOYEE', 'CONTACT_PERSON', 'ADMISSION_APPLICATION', 'DATA_SUBJECT_REQUEST')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."purge_candidates_action_enum" AS ENUM('DELETE', 'ANONYMIZE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."purge_candidates_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED')`,
    );

    await queryRunner.query(
      `CREATE TABLE "purge_candidates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "entity_type" "public"."purge_candidates_entity_type_enum" NOT NULL, "subject_id" uuid NOT NULL, "subject_label" text NOT NULL, "due_since" date NOT NULL, "action" "public"."purge_candidates_action_enum" NOT NULL, "status" "public"."purge_candidates_status_enum" NOT NULL DEFAULT 'PENDING', "reviewed_by_membership_id" uuid, "reviewed_at" TIMESTAMP WITH TIME ZONE, "executed_at" TIMESTAMP WITH TIME ZONE, "note" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_purge_candidates" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_purge_candidates_org" ON "purge_candidates" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_purge_candidates_status" ON "purge_candidates" ("status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_purge_candidate_org_entity_subject" ON "purge_candidates" ("organization_id", "entity_type", "subject_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "purge_candidates" ADD CONSTRAINT "FK_purge_candidates_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "purge_candidates"`);
    await queryRunner.query(
      `DROP TYPE "public"."purge_candidates_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."purge_candidates_action_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."purge_candidates_entity_type_enum"`,
    );
  }
}
