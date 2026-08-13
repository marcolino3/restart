import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Links an absence to the external calendar event mirroring it, so extending
 * an absence patches the existing event instead of creating a duplicate.
 * `provider` is a plain varchar validated against the TS enum in
 * employee-absences/entities/calendar-provider.enum.ts, not a PG enum — adding
 * a provider must not require a migration (CLAUDE.md 55P04 rule).
 */
export class CreateAbsenceCalendarSyncs1786500100000 implements MigrationInterface {
  name = 'CreateAbsenceCalendarSyncs1786500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "absence_calendar_syncs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "absence_id" uuid NOT NULL,
        "provider" varchar(20) NOT NULL DEFAULT 'GOOGLE',
        "calendar_id" varchar(320) NOT NULL,
        "external_event_id" varchar(1024) NOT NULL,
        "last_synced_at" TIMESTAMP WITH TIME ZONE,
        "last_error" text,
        CONSTRAINT "pk_absence_calendar_syncs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_absence_calendar_syncs_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_absence_calendar_syncs_absence" FOREIGN KEY ("absence_id")
          REFERENCES "employee_absences"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_absence_calendar_syncs_absence_provider" ON "absence_calendar_syncs" ("absence_id", "provider")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "absence_calendar_syncs"`);
  }
}
