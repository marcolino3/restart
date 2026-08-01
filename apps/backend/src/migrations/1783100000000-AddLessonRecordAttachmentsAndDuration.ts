import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Attachments on a lesson record, plus the optional worked-on duration.
 *
 * Attachments hold only metadata; the binary lives in object storage under
 * the key in `storage_key` and is served exclusively through the
 * authenticated, org-scoped LessonRecordAttachmentsController — never as a
 * public asset, because these files show identifiable children's work.
 *
 * `organization_id` is denormalised onto the attachment rather than reached
 * through the record: every read filters on it directly, so the tenant check
 * is a column comparison and cannot be lost in a join. ON DELETE CASCADE from
 * lesson_records means deleting a record takes its attachment rows with it
 * (the storage objects are removed by the delete route; orphaned blobs are
 * harmless since nothing can address them without a row).
 *
 * `uploaded_by_id` is SET NULL rather than CASCADE: a departing employee must
 * not silently delete the evidence they attached.
 *
 * `duration_minutes` is nullable on purpose — a teacher recording in passing
 * will not have the number, and a forced guess would poison the aggregations.
 *
 * Forward-only, no enum changes (so no PG16 55P04 concern here).
 */
export class AddLessonRecordAttachmentsAndDuration1783100000000 implements MigrationInterface {
  name = 'AddLessonRecordAttachmentsAndDuration1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        ADD COLUMN IF NOT EXISTS "duration_minutes" integer
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lesson_record_attachments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "lesson_record_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "storage_key" text NOT NULL,
        "file_name" text NOT NULL,
        "mime_type" text NOT NULL,
        "size_bytes" integer NOT NULL,
        "uploaded_by_id" uuid,
        CONSTRAINT "pk_lesson_record_attachments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "lesson_record_attachments"
          ADD CONSTRAINT "fk_lesson_record_attachments_record"
          FOREIGN KEY ("lesson_record_id") REFERENCES "lesson_records"("id")
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "lesson_record_attachments"
          ADD CONSTRAINT "fk_lesson_record_attachments_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "lesson_record_attachments"
          ADD CONSTRAINT "fk_lesson_record_attachments_uploader"
          FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id")
          ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Listing a record's attachments.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_record_attachments_record"
        ON "lesson_record_attachments" ("lesson_record_id")
    `);

    // Every read filters on the tenant first.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_record_attachments_org"
        ON "lesson_record_attachments" ("organization_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_lesson_record_attachments_org"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_lesson_record_attachments_record"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_record_attachments"`);
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        DROP COLUMN IF EXISTS "duration_minutes"
    `);
  }
}
