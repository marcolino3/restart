import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Access-review recertification records (Zugriffs-Review). One row per
 * (org, membership) stamping when a member's sensitive-data access was last
 * reviewed. The review list itself is computed live from RBAC. Access control
 * reuses the existing ROLE_ASSIGN permission — no new permission code.
 */
export class CreateAccessReviews1783061080000 implements MigrationInterface {
  name = 'CreateAccessReviews1783061080000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "access_review_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "membership_id" uuid NOT NULL, "last_reviewed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reviewed_by_membership_id" uuid, "note" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_access_review_records" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_access_review_records_org" ON "access_review_records" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_access_review_org_membership" ON "access_review_records" ("organization_id", "membership_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "access_review_records" ADD CONSTRAINT "FK_access_review_records_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "access_review_records"`);
  }
}
