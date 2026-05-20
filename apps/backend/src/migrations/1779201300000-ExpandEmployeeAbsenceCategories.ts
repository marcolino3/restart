import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandEmployeeAbsenceCategories1779201300000 implements MigrationInterface {
  name = 'ExpandEmployeeAbsenceCategories1779201300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // employee_absence_categories: alte Single-Language-Spalte entfernen
    await queryRunner.query(`
      ALTER TABLE "employee_absence_categories"
        DROP COLUMN IF EXISTS "name"
    `);

    // employee_absence_categories: neue funktionale Felder
    await queryRunner.query(`
      ALTER TABLE "employee_absence_categories"
        ADD COLUMN IF NOT EXISTS "counts_as_work_time" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "is_paid" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "affects_vacation_balance" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "default_is_vacation_capable" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "reduces_vacation_entitlement_after_days" integer,
        ADD COLUMN IF NOT EXISTS "requires_certificate" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "certificate_required_from_day" integer,
        ADD COLUMN IF NOT EXISTS "max_days_per_year" integer,
        ADD COLUMN IF NOT EXISTS "default_percentage" integer NOT NULL DEFAULT 100,
        ADD COLUMN IF NOT EXISTS "requires_approval" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "color" varchar(7),
        ADD COLUMN IF NOT EXISTS "icon_name" varchar,
        ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0
    `);

    // PG-Enum fuer locale (Tabelle-spezifisch, analog zu TypeORM-Default-Naming)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "employee_absence_category_translations_locale_enum"
          AS ENUM ('DE','FR','IT','EN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // employee_absence_category_translations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_absence_category_translations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "category_id" uuid NOT NULL,
        "locale" "employee_absence_category_translations_locale_enum" NOT NULL,
        "name" text NOT NULL,
        "description" text,
        CONSTRAINT "pk_employee_absence_category_translations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_employee_absence_category_translations_category"
          FOREIGN KEY ("category_id")
          REFERENCES "employee_absence_categories"("id")
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employee_absence_category_translation"
      ON "employee_absence_category_translations" ("category_id", "locale")
    `);

    // employee_absences: Ferienfaehigkeit pro Fall
    await queryRunner.query(`
      ALTER TABLE "employee_absences"
        ADD COLUMN IF NOT EXISTS "is_vacation_capable" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "employee_absences"
        DROP COLUMN IF EXISTS "is_vacation_capable"
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_employee_absence_category_translation"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "employee_absence_category_translations"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "employee_absence_category_translations_locale_enum"`,
    );
    await queryRunner.query(`
      ALTER TABLE "employee_absence_categories"
        DROP COLUMN IF EXISTS "counts_as_work_time",
        DROP COLUMN IF EXISTS "is_paid",
        DROP COLUMN IF EXISTS "affects_vacation_balance",
        DROP COLUMN IF EXISTS "default_is_vacation_capable",
        DROP COLUMN IF EXISTS "reduces_vacation_entitlement_after_days",
        DROP COLUMN IF EXISTS "requires_certificate",
        DROP COLUMN IF EXISTS "certificate_required_from_day",
        DROP COLUMN IF EXISTS "max_days_per_year",
        DROP COLUMN IF EXISTS "default_percentage",
        DROP COLUMN IF EXISTS "requires_approval",
        DROP COLUMN IF EXISTS "color",
        DROP COLUMN IF EXISTS "icon_name",
        DROP COLUMN IF EXISTS "sort_order"
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_absence_categories"
        ADD COLUMN IF NOT EXISTS "name" text
    `);
  }
}
