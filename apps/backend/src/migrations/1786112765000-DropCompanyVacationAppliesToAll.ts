import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Company vacations no longer auto-apply to all employees — every assignment
 * must go through `company_vacation_assignments`.
 */
export class DropCompanyVacationAppliesToAll1786112765000 implements MigrationInterface {
  name = 'DropCompanyVacationAppliesToAll1786112765000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_vacations" DROP COLUMN IF EXISTS "applies_to_all"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "company_vacations" ADD COLUMN "applies_to_all" boolean NOT NULL DEFAULT true`,
    );
  }
}
