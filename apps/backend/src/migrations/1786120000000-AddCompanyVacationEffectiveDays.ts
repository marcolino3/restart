import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persisted count of effective vacation days (weekdays minus holidays) for
 * company vacations, recomputed on company-vacation and holiday CRUD.
 */
export class AddCompanyVacationEffectiveDays1786120000000 implements MigrationInterface {
  name = 'AddCompanyVacationEffectiveDays1786120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_vacations" ADD COLUMN IF NOT EXISTS "effective_days" numeric(5,1) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_vacations" DROP COLUMN IF EXISTS "effective_days"`,
    );
  }
}
