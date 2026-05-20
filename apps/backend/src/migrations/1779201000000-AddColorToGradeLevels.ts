import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColorToGradeLevels1779201000000 implements MigrationInterface {
  name = 'AddColorToGradeLevels1779201000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "grade_levels"
        ADD COLUMN IF NOT EXISTS "color" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "grade_levels" DROP COLUMN IF EXISTS "color"`,
    );
  }
}
