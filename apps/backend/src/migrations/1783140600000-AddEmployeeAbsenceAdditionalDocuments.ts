import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Additional absence documents (e.g. accident reports) as private storage URLs.
 */
export class AddEmployeeAbsenceAdditionalDocuments1783140600000 implements MigrationInterface {
  name = 'AddEmployeeAbsenceAdditionalDocuments1783140600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "additional_document_urls" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "additional_document_urls"`,
    );
  }
}
