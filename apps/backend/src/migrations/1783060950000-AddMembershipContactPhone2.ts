import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Employee onboarding: a secondary contact phone (no country mask, e.g. a
 * foreign number) on the membership, alongside the primary contact_phone.
 */
export class AddMembershipContactPhone21783060950000
  implements MigrationInterface
{
  name = 'AddMembershipContactPhone21783060950000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD "contact_phone2" character varying(40)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP COLUMN "contact_phone2"`,
    );
  }
}
