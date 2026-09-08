import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Shift work on the employee contract: whether the employee works shifts, on
 * which weekdays (subset of the working days) and the per-shift preferences
 * (PREFERRED / AVOID, neutral is not stored). Plain jsonb, no PG enum.
 */
export class AddContractShiftFields1787100300000 implements MigrationInterface {
  name = 'AddContractShiftFields1787100300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD "works_shifts" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD "shift_weekdays" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD "shift_preferences" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP COLUMN "shift_preferences"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP COLUMN "shift_weekdays"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP COLUMN "works_shifts"`,
    );
  }
}
