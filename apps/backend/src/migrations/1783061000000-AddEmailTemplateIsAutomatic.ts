import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Marks an email template as sent automatically (e.g. the intake confirmation)
 * vs. manually — surfaced as an "Automatisch/Manuell" badge on the template
 * cards. Additive, non-null with a default, so existing templates become manual.
 */
export class AddEmailTemplateIsAutomatic1783061000000 implements MigrationInterface {
  name = 'AddEmailTemplateIsAutomatic1783061000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_templates" ADD COLUMN IF NOT EXISTS "is_automatic" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_templates" DROP COLUMN IF EXISTS "is_automatic"`,
    );
  }
}
