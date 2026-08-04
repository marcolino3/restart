import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Feiertage: jährliche Wiederholung + Entfernung des ungenutzten Kanton-Felds.
 */
export class AddHolidayRepeatsYearly1783140400000 implements MigrationInterface {
  name = 'AddHolidayRepeatsYearly1783140400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "holidays" ADD COLUMN IF NOT EXISTS "repeats_yearly" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "holidays" DROP COLUMN IF EXISTS "canton"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "holidays" ADD COLUMN IF NOT EXISTS "canton" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "holidays" DROP COLUMN IF EXISTS "repeats_yearly"`,
    );
  }
}
