import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vertragsupload: a single linked contract document (PDF) per contract,
 * stored via /api/upload; the resulting URL is kept on the contract.
 */
export class AddEmployeeContractDocumentUrl1783060960000
  implements MigrationInterface
{
  name = 'AddEmployeeContractDocumentUrl1783060960000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD "document_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP COLUMN "document_url"`,
    );
  }
}
