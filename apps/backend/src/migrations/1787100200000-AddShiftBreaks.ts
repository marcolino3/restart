import { MigrationInterface, QueryRunner } from 'typeorm';

/** Unpaid breaks per shift as `[{ startTime, endTime }]` (HH:MM). */
export class AddShiftBreaks1787100200000 implements MigrationInterface {
  name = 'AddShiftBreaks1787100200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD "breaks" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shifts" DROP COLUMN "breaks"`);
  }
}
