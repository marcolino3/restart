import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an optional display `title` and free-text `tags` (keywords) to admission
 * documents. Forward-only / additive; `tags` defaults to an empty array.
 */
export class AddAdmissionDocumentTitleTags1783061370000 implements MigrationInterface {
  name = 'AddAdmissionDocumentTitleTags1783061370000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_documents"
        ADD COLUMN IF NOT EXISTS "title" text,
        ADD COLUMN IF NOT EXISTS "tags" text[] NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_documents"
        DROP COLUMN IF EXISTS "tags",
        DROP COLUMN IF EXISTS "title"
    `);
  }
}
