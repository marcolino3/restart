import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Links an admission appointment to a mirror MEETING activity so the appointment
 * surfaces in the application's activity timeline. Nullable FK with
 * `ON DELETE SET NULL` — removing the activity independently must never break the
 * appointment row, and legacy appointments without a mirror activity stay valid.
 * Forward-only / additive.
 */
export class AddAdmissionAppointmentActivity1783061410000 implements MigrationInterface {
  name = 'AddAdmissionAppointmentActivity1783061410000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_appointments"
        ADD COLUMN IF NOT EXISTS "activity_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "admission_appointments"
        ADD CONSTRAINT "fk_admission_appointments_activity"
        FOREIGN KEY ("activity_id")
        REFERENCES "admission_activities"("id")
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission_appointments" DROP CONSTRAINT IF EXISTS "fk_admission_appointments_activity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_appointments" DROP COLUMN IF EXISTS "activity_id"`,
    );
  }
}
