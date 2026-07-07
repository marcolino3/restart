import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds POSTPONED and TENTATIVE to the admission appointment status enum.
 *
 * PG16 rule (55P04): `ALTER TYPE ... ADD VALUE` must be committed before the
 * new value is used. This migration ONLY adds the values (no usage), and
 * migrationsTransactionMode='each' commits it on its own — so any later
 * migration may safely reference them. `IF NOT EXISTS` keeps it idempotent.
 */
export class AddAdmissionAppointmentStatuses1783061330000 implements MigrationInterface {
  name = 'AddAdmissionAppointmentStatuses1783061330000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "admission_appointment_status_enum" ADD VALUE IF NOT EXISTS 'POSTPONED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "admission_appointment_status_enum" ADD VALUE IF NOT EXISTS 'TENTATIVE'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop enum values; forward-only. No-op down.
  }
}
