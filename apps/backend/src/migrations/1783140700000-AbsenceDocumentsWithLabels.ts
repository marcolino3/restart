import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Multi-file certificates + labeled documents on employee absences.
 * Migrates legacy certificate_url (varchar) and additional_document_urls (string[]).
 */
export class AbsenceDocumentsWithLabels1783140700000 implements MigrationInterface {
  name = 'AbsenceDocumentsWithLabels1783140700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "certificates" jsonb NOT NULL DEFAULT '[]'`,
    );

    await queryRunner.query(`
      UPDATE "employee_absences"
      SET "certificates" = jsonb_build_array(
        jsonb_build_object('url', "certificate_url", 'label', '')
      )
      WHERE "certificate_url" IS NOT NULL
        AND TRIM("certificate_url") <> ''
        AND ("certificates" IS NULL OR "certificates" = '[]'::jsonb)
    `);

    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "certificate_url"`,
    );

    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "additional_documents" jsonb NOT NULL DEFAULT '[]'`,
    );

    await queryRunner.query(`
      UPDATE "employee_absences"
      SET "additional_documents" = COALESCE(
        (
          SELECT jsonb_agg(
            CASE
              WHEN jsonb_typeof(elem) = 'string'
                THEN jsonb_build_object('url', elem #>> '{}', 'label', '')
              ELSE elem
            END
          )
          FROM jsonb_array_elements("additional_document_urls") AS elem
        ),
        '[]'::jsonb
      )
      WHERE "additional_document_urls" IS NOT NULL
        AND "additional_document_urls" <> '[]'::jsonb
        AND ("additional_documents" IS NULL OR "additional_documents" = '[]'::jsonb)
    `);

    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "additional_document_urls"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "certificate_url" character varying`,
    );

    await queryRunner.query(`
      UPDATE "employee_absences"
      SET "certificate_url" = "certificates"->0->>'url'
      WHERE jsonb_array_length("certificates") > 0
    `);

    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "certificates"`,
    );

    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "additional_document_urls" jsonb NOT NULL DEFAULT '[]'`,
    );

    await queryRunner.query(`
      UPDATE "employee_absences"
      SET "additional_document_urls" = COALESCE(
        (
          SELECT jsonb_agg(elem->>'url')
          FROM jsonb_array_elements("additional_documents") AS elem
        ),
        '[]'::jsonb
      )
      WHERE "additional_documents" IS NOT NULL
        AND "additional_documents" <> '[]'::jsonb
    `);

    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "additional_documents"`,
    );
  }
}
