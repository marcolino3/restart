import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-membership UI color theme (design handoff "SaaS-Shell mit
 * Theme-System"): the selected theme is stored on the membership so each
 * user can pick a different theme per organization. Users without a
 * membership (SuperAdmin) store their theme on the users table instead.
 */
export class AddThemePreference1779202300000 implements MigrationInterface {
  name = 'AddThemePreference1779202300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD "theme" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "theme" character varying(30)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "theme"`);
    await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "theme"`);
  }
}
