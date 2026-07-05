import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Employee onboarding: a personal/private e-mail address on the user, distinct
 * from the login e-mail (which lives on user_emails). Used for HR contact, not
 * authentication.
 */
export class AddUserPrivateEmail1783060940000 implements MigrationInterface {
  name = 'AddUserPrivateEmail1783060940000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "private_email" character varying(320)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "private_email"`);
  }
}
