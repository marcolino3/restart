import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Employee onboarding wizard: store a preferred locale ("de"/"en") for
 * invitation e-mails and UI defaults, and an uploaded profile photo URL.
 * Language lives on both users (SuperAdmin / global) and memberships (per-org),
 * mirroring the existing `theme` column.
 */
export class AddUserAvatarAndLanguage1783060910000
  implements MigrationInterface
{
  name = 'AddUserAvatarAndLanguage1783060910000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "language" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatar_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD "language" character varying(10)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "language"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "language"`);
  }
}
