import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Assignees join table for admission appointments — an appointment can have
 * several responsible memberships. Split into its own migration (rather than
 * folded into CreateAdmissionAppointments) so it applies to databases that
 * already ran the appointments migration. Forward-only / additive.
 */
export class CreateAdmissionAppointmentAssignees1783061320000 implements MigrationInterface {
  name = 'CreateAdmissionAppointmentAssignees1783061320000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_appointment_assignees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "appointment_id" uuid NOT NULL,
        "membership_id" uuid NOT NULL,
        CONSTRAINT "pk_admission_appointment_assignees" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_appointment_assignees_appointment"
          FOREIGN KEY ("appointment_id") REFERENCES "admission_appointments"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_appointment_assignees_membership"
          FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_appointment_assignees_appointment" ON "admission_appointment_assignees" ("appointment_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_admission_appointment_assignees" ON "admission_appointment_assignees" ("appointment_id", "membership_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "admission_appointment_assignees"`,
    );
  }
}
