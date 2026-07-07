import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds RESCHEDULING to the admission appointment status enum — "postponed, no
 * new date fixed yet". Replaces the earlier POSTPONED/TENTATIVE values at the
 * application layer (Postgres cannot drop enum values, so those remain in the
 * type but are no longer used).
 *
 * PG16 rule (55P04): ADD VALUE only, committed on its own via
 * migrationsTransactionMode='each' before any usage. Idempotent.
 */
export class AddAdmissionAppointmentRescheduling1783061350000 implements MigrationInterface {
  name = 'AddAdmissionAppointmentRescheduling1783061350000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "admission_appointment_status_enum" ADD VALUE IF NOT EXISTS 'RESCHEDULING'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot drop enum values; forward-only. No-op down.
  }
}
