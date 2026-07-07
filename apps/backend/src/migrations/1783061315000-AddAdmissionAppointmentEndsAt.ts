import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Optional end of an admission appointment (`ends_at`): `null` = single-point
 * appointment, set = a period (e.g. a multi-day trial week) whose start is
 * `scheduled_at`. Split into its own migration (rather than folded into
 * CreateAdmissionAppointments) so it applies to databases that already ran the
 * appointments migration. Forward-only / additive.
 */
export class AddAdmissionAppointmentEndsAt1783061315000 implements MigrationInterface {
  name = 'AddAdmissionAppointmentEndsAt1783061315000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_appointments"
        ADD COLUMN IF NOT EXISTS "ends_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission_appointments" DROP COLUMN IF EXISTS "ends_at"`,
    );
  }
}
