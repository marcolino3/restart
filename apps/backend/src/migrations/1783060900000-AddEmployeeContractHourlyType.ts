import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The employee onboarding wizard introduces the "Stundenlohn" contract type.
 * Add the HOURLY value to the existing Postgres enum
 * `employee_contracts_contract_type_enum`.
 *
 * `ADD VALUE` must live in its OWN migration, separate from any migration that
 * USES the value — on a fresh PG16 DB with `migrationsTransactionMode: 'each'`
 * a value added and used in the same transaction aborts with 55P04 (see
 * CLAUDE.md). `down()` is a no-op because PostgreSQL cannot remove enum values
 * (forward-only / expand-contract).
 */
export class AddEmployeeContractHourlyType1783060900000 implements MigrationInterface {
  name = 'AddEmployeeContractHourlyType1783060900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."employee_contracts_contract_type_enum" ADD VALUE IF NOT EXISTS 'HOURLY'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing values from an enum type; no-op.
    // (Forward-only / expand-contract — see CLAUDE.md.)
  }
}
