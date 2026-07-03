import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Grade levels get the fields from the design handoff ("Stufen" screen):
 * a short code (e.g. "US 1-3") and an age range (e.g. 6-9 years).
 */
export class AddGradeLevelDetails1779202200000 implements MigrationInterface {
  name = 'AddGradeLevelDetails1779202200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "grade_levels" ADD "shortCode" text`);
    await queryRunner.query(`ALTER TABLE "grade_levels" ADD "ageMin" integer`);
    await queryRunner.query(`ALTER TABLE "grade_levels" ADD "ageMax" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "grade_levels" DROP COLUMN "ageMax"`);
    await queryRunner.query(`ALTER TABLE "grade_levels" DROP COLUMN "ageMin"`);
    await queryRunner.query(
      `ALTER TABLE "grade_levels" DROP COLUMN "shortCode"`,
    );
  }
}
