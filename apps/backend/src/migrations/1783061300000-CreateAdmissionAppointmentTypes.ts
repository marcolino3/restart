import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Org-configurable list of admission appointment types (e.g. Schnuppertag,
 * Elterngespräch). Mirrors admission_rejection_reasons: same AbstractEntity
 * base columns, position ordering, archive flag, org-scoped with CASCADE.
 */
export class CreateAdmissionAppointmentTypes1783061300000 implements MigrationInterface {
  name = 'CreateAdmissionAppointmentTypes1783061300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_appointment_types" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "label" text NOT NULL,
        "color" text,
        "position" integer NOT NULL DEFAULT 0,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "pk_admission_appointment_types" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_appointment_types_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_appointment_types_org" ON "admission_appointment_types" ("organization_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "admission_appointment_types"`,
    );
  }
}
