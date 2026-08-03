import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hourly, substitute and freelance contracts are paid per hour rather than per
 * month. `hourly_rate` holds that rate; it is mutually exclusive with
 * `gross_salary` (enforced in contract-type-rules.ts).
 */
export class AddEmployeeContractHourlyRate1783140300000 implements MigrationInterface {
  name = 'AddEmployeeContractHourlyRate1783140300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP COLUMN IF EXISTS "hourly_rate"`,
    );
  }
}
