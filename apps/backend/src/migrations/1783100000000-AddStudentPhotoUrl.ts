import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a photo URL to the student.
 *
 * Nullable on purpose: most students will never get a photo, and every
 * existing student obviously has none yet. The column stays empty until
 * somebody uploads one via the upload controller, which writes the public
 * asset URL back onto this field.
 */
export class AddStudentPhotoUrl1783100000000 implements MigrationInterface {
  name = 'AddStudentPhotoUrl1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD COLUMN IF NOT EXISTS "photo_url" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        DROP COLUMN IF EXISTS "photo_url"
    `);
  }
}
