import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Scope 2 — Förderprofil / support-record log. Creates three tables:
 *   - student_record_categories (org-managed category list, like admission_sources)
 *   - student_record_entries    (log entry per student, like admission_activities)
 *   - student_record_documents  (file attachments per entry, like admission_documents)
 *
 * Forward-only / additive. AbstractEntity columns (version/isActive/isArchived/
 * createdAt/updatedAt/deletedAt) mirror the CreateAdmissionSources template.
 */
export class CreateStudentRecords1783061620000 implements MigrationInterface {
  name = 'CreateStudentRecords1783061620000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Org-managed support-record categories.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_record_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "name" text NOT NULL,
        "color" text,
        "position" integer NOT NULL DEFAULT 0,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "pk_student_record_categories" PRIMARY KEY ("id"),
        CONSTRAINT "fk_student_record_categories_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_student_record_categories_org" ON "student_record_categories" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_student_record_categories_org_name" ON "student_record_categories" ("organization_id", "name")`,
    );

    // 2) Log entries per student.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_record_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "category_id" uuid,
        "title" character varying(200),
        "content" text,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_confidential" boolean NOT NULL DEFAULT true,
        "author_membership_id" uuid,
        CONSTRAINT "pk_student_record_entries" PRIMARY KEY ("id"),
        CONSTRAINT "fk_student_record_entries_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_student_record_entries_student"
          FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_student_record_entries_category"
          FOREIGN KEY ("category_id") REFERENCES "student_record_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_student_record_entries_author"
          FOREIGN KEY ("author_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_student_record_entries_org" ON "student_record_entries" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_student_record_entries_student_occurred" ON "student_record_entries" ("student_id", "occurred_at")`,
    );

    // 3) File attachments per entry.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_record_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "entry_id" uuid NOT NULL,
        "file_id" uuid NOT NULL,
        "original_name" text NOT NULL,
        "title" text,
        "tags" text array NOT NULL DEFAULT '{}',
        "mime_type" text NOT NULL,
        "size_bytes" integer NOT NULL,
        "uploaded_by_membership_id" uuid,
        CONSTRAINT "pk_student_record_documents" PRIMARY KEY ("id"),
        CONSTRAINT "fk_student_record_documents_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_student_record_documents_entry"
          FOREIGN KEY ("entry_id") REFERENCES "student_record_entries"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_student_record_documents_uploader"
          FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_student_record_documents_org" ON "student_record_documents" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_student_record_documents_entry" ON "student_record_documents" ("entry_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "student_record_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_record_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_record_categories"`);
  }
}
