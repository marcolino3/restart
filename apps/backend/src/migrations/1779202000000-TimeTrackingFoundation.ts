import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PR-A — Arbeitszeiterfassung Foundation.
 *
 * Erweitert die bestehenden Tabellen (time_tracking_entries, employee_contracts,
 * employee_absences) und legt die neuen Tabellen für Feiertage, Betriebsferien,
 * persönliche Ferien, Abrechnungsperioden (Stichtag), Eröffnungssalden,
 * ausbezahlte Überzeit und das materialisierte Tages-Ledger (work_day_balances) an.
 *
 * Forward-only / expand-contract (siehe CLAUDE.md).
 */
export class TimeTrackingFoundation1779202000000 implements MigrationInterface {
  name = 'TimeTrackingFoundation1779202000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------------------------------------------------------------------
    // Enums
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."time_tracking_entries_source_enum" AS ENUM ('CLOCK', 'MANUAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."time_tracking_periods_status_enum" AS ENUM ('OPEN', 'LOCKED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ---------------------------------------------------------------------
    // time_tracking_entries: entry_date / work_minutes / source
    // ---------------------------------------------------------------------
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" ADD COLUMN IF NOT EXISTS "entry_date" date`,
    );
    // Backfill aus started_at, damit NOT NULL gesetzt werden kann.
    await queryRunner.query(
      `UPDATE "time_tracking_entries" SET "entry_date" = ("started_at")::date WHERE "entry_date" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" ALTER COLUMN "entry_date" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" ADD COLUMN IF NOT EXISTS "work_minutes" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" ADD COLUMN IF NOT EXISTS "source" "public"."time_tracking_entries_source_enum" NOT NULL DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_time_tracking_employee_entry_date" ON "time_tracking_entries" ("employee_id", "entry_date")`,
    );

    // ---------------------------------------------------------------------
    // employee_contracts: weekday_workloads
    // ---------------------------------------------------------------------
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD COLUMN IF NOT EXISTS "weekday_workloads" jsonb`,
    );

    // ---------------------------------------------------------------------
    // employee_absences: percentage
    // ---------------------------------------------------------------------
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "percentage" integer NOT NULL DEFAULT 100`,
    );

    // ---------------------------------------------------------------------
    // holidays
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "holidays" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "date" date NOT NULL,
        "name" character varying(200) NOT NULL,
        "paid_percentage" integer NOT NULL DEFAULT 100,
        "canton" character varying(50),
        CONSTRAINT "pk_holidays" PRIMARY KEY ("id"),
        CONSTRAINT "uq_holidays_org_date" UNIQUE ("organization_id", "date"),
        CONSTRAINT "fk_holidays_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_holidays_org_date" ON "holidays" ("organization_id", "date")`,
    );

    // ---------------------------------------------------------------------
    // company_vacations
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_vacations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "applies_to_all" boolean NOT NULL DEFAULT true,
        CONSTRAINT "pk_company_vacations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_company_vacations_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_company_vacations_org" ON "company_vacations" ("organization_id")`,
    );

    // ---------------------------------------------------------------------
    // employee_vacations
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_vacations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "membership_id" uuid NOT NULL,
        "name" character varying(200),
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        CONSTRAINT "pk_employee_vacations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_employee_vacations_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_employee_vacations_employee" FOREIGN KEY ("employee_id")
          REFERENCES "employees"("id"),
        CONSTRAINT "fk_employee_vacations_membership" FOREIGN KEY ("membership_id")
          REFERENCES "memberships"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_employee_vacations_employee" ON "employee_vacations" ("employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_employee_vacations_org" ON "employee_vacations" ("organization_id")`,
    );

    // ---------------------------------------------------------------------
    // time_tracking_periods
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "time_tracking_periods" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "label" character varying(50) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" "public"."time_tracking_periods_status_enum" NOT NULL DEFAULT 'OPEN',
        CONSTRAINT "pk_time_tracking_periods" PRIMARY KEY ("id"),
        CONSTRAINT "uq_time_tracking_periods_org_start" UNIQUE ("organization_id", "start_date"),
        CONSTRAINT "fk_time_tracking_periods_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_time_tracking_periods_org" ON "time_tracking_periods" ("organization_id")`,
    );

    // ---------------------------------------------------------------------
    // employee_period_opening_balances
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_period_opening_balances" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "period_id" uuid NOT NULL,
        "opening_work_minutes" integer NOT NULL DEFAULT 0,
        "opening_vacation_days" numeric(6,2) NOT NULL DEFAULT 0,
        CONSTRAINT "pk_employee_period_opening_balances" PRIMARY KEY ("id"),
        CONSTRAINT "uq_employee_period_opening_balance" UNIQUE ("employee_id", "period_id"),
        CONSTRAINT "fk_epob_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_epob_employee" FOREIGN KEY ("employee_id")
          REFERENCES "employees"("id"),
        CONSTRAINT "fk_epob_period" FOREIGN KEY ("period_id")
          REFERENCES "time_tracking_periods"("id") ON DELETE CASCADE
      )
    `);

    // ---------------------------------------------------------------------
    // employee_paid_overtime
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_paid_overtime" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "date" date NOT NULL,
        "minutes" integer NOT NULL,
        "note" text,
        "created_by_membership_id" uuid,
        CONSTRAINT "pk_employee_paid_overtime" PRIMARY KEY ("id"),
        CONSTRAINT "fk_employee_paid_overtime_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_employee_paid_overtime_employee" FOREIGN KEY ("employee_id")
          REFERENCES "employees"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_employee_paid_overtime_employee" ON "employee_paid_overtime" ("employee_id", "date")`,
    );

    // ---------------------------------------------------------------------
    // work_day_balances (Ledger)
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_day_balances" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "date" date NOT NULL,
        "contract_id" uuid,
        "planned_minutes" integer NOT NULL DEFAULT 0,
        "worked_minutes" integer NOT NULL DEFAULT 0,
        "vacation_minutes" integer NOT NULL DEFAULT 0,
        "absence_minutes" integer NOT NULL DEFAULT 0,
        "actual_minutes" integer NOT NULL DEFAULT 0,
        "difference_minutes" integer NOT NULL DEFAULT 0,
        "capped_minutes" integer NOT NULL DEFAULT 0,
        "is_weekend" boolean NOT NULL DEFAULT false,
        "is_holiday" boolean NOT NULL DEFAULT false,
        "is_vacation" boolean NOT NULL DEFAULT false,
        "is_absence" boolean NOT NULL DEFAULT false,
        "is_free_day" boolean NOT NULL DEFAULT false,
        "is_no_contract" boolean NOT NULL DEFAULT false,
        "overtime_capped" boolean NOT NULL DEFAULT false,
        "computed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "pk_work_day_balances" PRIMARY KEY ("id"),
        CONSTRAINT "uq_work_day_balance_employee_date" UNIQUE ("employee_id", "date"),
        CONSTRAINT "fk_work_day_balances_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_work_day_balance_org_emp_date" ON "work_day_balances" ("organization_id", "employee_id", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "work_day_balances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_paid_overtime"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "employee_period_opening_balances"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "time_tracking_periods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_vacations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_vacations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "holidays"`);

    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "percentage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP COLUMN IF EXISTS "weekday_workloads"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_time_tracking_employee_entry_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" DROP COLUMN IF EXISTS "source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" DROP COLUMN IF EXISTS "work_minutes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" DROP COLUMN IF EXISTS "entry_date"`,
    );

    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."time_tracking_periods_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."time_tracking_entries_source_enum"`,
    );
  }
}
