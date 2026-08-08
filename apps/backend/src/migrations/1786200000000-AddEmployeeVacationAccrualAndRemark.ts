import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds accrual-type and remark to individual employee vacations, matching
 * the design's "Anrechnung" / "Bemerkung" fields.
 */
export class AddEmployeeVacationAccrualAndRemark1786200000000 implements MigrationInterface {
  name = 'AddEmployeeVacationAccrualAndRemark1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."employee_vacations_accrual_type_enum" AS ENUM('CHARGED', 'PAID_NO_CHARGE', 'UNPAID')`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_vacations" ADD COLUMN IF NOT EXISTS "accrual_type" "public"."employee_vacations_accrual_type_enum" NOT NULL DEFAULT 'CHARGED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_vacations" ADD COLUMN IF NOT EXISTS "remark" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_vacations" DROP COLUMN IF EXISTS "remark"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_vacations" DROP COLUMN IF EXISTS "accrual_type"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."employee_vacations_accrual_type_enum"`,
    );
  }
}
