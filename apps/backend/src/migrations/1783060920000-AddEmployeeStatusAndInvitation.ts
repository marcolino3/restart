import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Employee onboarding wizard: a lifecycle status (DRAFT while the wizard is
 * still auto-saving, ACTIVE once finalized) and invitation tracking for the
 * first-login flow (better-auth password reset), including an optional
 * scheduled send time (invitation on the entry date, dispatched by the nightly
 * cron).
 */
export class AddEmployeeStatusAndInvitation1783060920000 implements MigrationInterface {
  name = 'AddEmployeeStatusAndInvitation1783060920000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."employees_status_enum" AS ENUM('DRAFT', 'ACTIVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD "status" "public"."employees_status_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."employees_invitation_status_enum" AS ENUM('PENDING', 'SCHEDULED', 'SENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD "invitation_status" "public"."employees_invitation_status_enum" NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD "invitation_scheduled_send_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD "invited_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "invited_at"`);
    await queryRunner.query(
      `ALTER TABLE "employees" DROP COLUMN "invitation_scheduled_send_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP COLUMN "invitation_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."employees_invitation_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."employees_status_enum"`);
  }
}
