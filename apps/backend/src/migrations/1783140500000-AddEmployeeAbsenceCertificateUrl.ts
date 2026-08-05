import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Arztzeugnis / Nachweis URL on employee absences (private storage path).
 */
export class AddEmployeeAbsenceCertificateUrl1783140500000 implements MigrationInterface {
  name = 'AddEmployeeAbsenceCertificateUrl1783140500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "certificate_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "certificate_url"`,
    );
  }
}
