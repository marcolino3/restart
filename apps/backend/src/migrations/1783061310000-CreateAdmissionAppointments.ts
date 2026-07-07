import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Admission appointments: scheduled meetings tied to an application (optionally
 * typed via admission_appointment_types). Brand-new status enum type created and
 * used in the same migration — permitted under PG16 (only ALTER TYPE ADD VALUE +
 * same-tx usage is forbidden, not CREATE TYPE + usage).
 */
export class CreateAdmissionAppointments1783061310000 implements MigrationInterface {
  name = 'CreateAdmissionAppointments1783061310000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "admission_appointment_status_enum" AS ENUM (
          'SCHEDULED', 'COMPLETED', 'CANCELLED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_appointments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "appointment_type_id" uuid,
        "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "duration_minutes" integer,
        "location" text,
        "note" text,
        "status" "admission_appointment_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "created_by_membership_id" uuid,
        CONSTRAINT "pk_admission_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_appointments_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_appointments_application"
          FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_appointments_type"
          FOREIGN KEY ("appointment_type_id") REFERENCES "admission_appointment_types"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_admission_appointments_created_by"
          FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_appointments_org_scheduled" ON "admission_appointments" ("organization_id", "scheduled_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_appointments_app" ON "admission_appointments" ("application_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_appointments"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admission_appointment_status_enum"`,
    );
  }
}
