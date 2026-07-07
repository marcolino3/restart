import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Admission documents: file attachments (PDF/image) tied to an application. Only
 * metadata is stored here; the binary lives in object storage under an
 * org-scoped key derived from `file_id`.
 */
export class CreateAdmissionDocuments1783061360000 implements MigrationInterface {
  name = 'CreateAdmissionDocuments1783061360000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "file_id" uuid NOT NULL,
        "original_name" text NOT NULL,
        "mime_type" text NOT NULL,
        "size_bytes" integer NOT NULL,
        "uploaded_by_membership_id" uuid,
        CONSTRAINT "pk_admission_documents" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_documents_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_documents_application"
          FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_documents_uploaded_by"
          FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_documents_org" ON "admission_documents" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_documents_app" ON "admission_documents" ("application_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_documents"`);
  }
}
