import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Turns school_class_teachers from a plain join table into a real entity so a
 * class assignment can carry a role, a workload and a validity range.
 *
 * Multiple LEAD teachers per class are explicitly allowed — co-teaching and
 * job sharing (two class teachers at 60/60 %) are the normal case in a
 * Montessori setting, so this is a role per assignment rather than a single
 * "is primary" flag.
 *
 * The validity range is what makes historical class lists work without a
 * SchoolYear entity: a teacher change in August ends one row and starts
 * another, and "who taught Primaria A in March 2025" is a date filter.
 *
 * Note the primary key swap. The old PK was (school_class_id, employee_id),
 * which would forbid the same person being assigned twice — exactly what a
 * history needs (leave and return, or a workload change). A surrogate id
 * replaces it; a partial unique index keeps the guarantee that matters:
 * one person cannot hold two *open* assignments in the same class.
 *
 * Forward-only / expand. The table is empty in every known environment, but
 * the migration backfills defaults anyway so it is safe on populated ones.
 */
export class AddSchoolClassTeacherRoles1783080100000 implements MigrationInterface {
  name = 'AddSchoolClassTeacherRoles1783080100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."school_class_teachers_role_enum"
          AS ENUM('LEAD', 'ASSISTANT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // The AbstractEntity columns come first — every entity-backed table in the
    // repo carries them (compare school_class_enrollments), and the entity
    // below extends AbstractEntity, so leaving them out would desync the
    // schema from the model.
    await queryRunner.query(`
      ALTER TABLE "school_class_teachers"
        ADD COLUMN IF NOT EXISTS "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "isArchived" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "deletedAt" date,
        ADD COLUMN IF NOT EXISTS "role" "public"."school_class_teachers_role_enum"
          NOT NULL DEFAULT 'LEAD',
        ADD COLUMN IF NOT EXISTS "workload_percent" smallint,
        ADD COLUMN IF NOT EXISTS "valid_from" date NOT NULL DEFAULT CURRENT_DATE,
        ADD COLUMN IF NOT EXISTS "valid_to" date,
        ADD COLUMN IF NOT EXISTS "organization_id" uuid
    `);

    // Existing rows predate multi-tenancy on this table — derive the org from
    // the class they belong to.
    //
    // valid_from is backfilled to the start of the current school year, not to
    // the migration date: an existing assignment has been in force all year,
    // and dating it "today" would hide it from every historical class list
    // before the deploy. Rows added after this run get CURRENT_DATE, which is
    // correct for a genuinely new assignment.
    await queryRunner.query(`
      UPDATE "school_class_teachers" sct
        SET "organization_id" = sc."organization_id",
            "valid_from" = make_date(
              CASE
                WHEN (CURRENT_DATE >= make_date(
                       EXTRACT(YEAR FROM CURRENT_DATE)::int,
                       o."school_year_start_month",
                       o."school_year_start_day"))
                THEN EXTRACT(YEAR FROM CURRENT_DATE)::int
                ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int - 1
              END,
              o."school_year_start_month",
              o."school_year_start_day"
            )
        FROM "school_classes" sc
        JOIN "organizations" o ON o."id" = sc."organization_id"
        WHERE sc."id" = sct."school_class_id"
          AND sct."organization_id" IS NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "school_class_teachers"
          ALTER COLUMN "organization_id" SET NOT NULL;
      EXCEPTION WHEN others THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "school_class_teachers"
          ADD CONSTRAINT "fk_school_class_teachers_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
          ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "school_class_teachers"
          ADD CONSTRAINT "chk_school_class_teachers_workload"
          CHECK ("workload_percent" IS NULL
                 OR "workload_percent" BETWEEN 0 AND 100);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "school_class_teachers"
          ADD CONSTRAINT "chk_school_class_teachers_validity"
          CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from");
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Swap the composite PK for a surrogate one so history can repeat a pair.
    await queryRunner.query(`
      ALTER TABLE "school_class_teachers"
        DROP CONSTRAINT IF EXISTS "PK_e25cc1dc4832a79090dfc11c637"
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "school_class_teachers"
          ADD CONSTRAINT "pk_school_class_teachers" PRIMARY KEY ("id");
      EXCEPTION WHEN others THEN null; END $$;
    `);

    // One open assignment per person and class; closed ones may repeat.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_school_class_teachers_open"
        ON "school_class_teachers" ("school_class_id", "employee_id")
        WHERE "valid_to" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_school_class_teachers_org"
        ON "school_class_teachers" ("organization_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_school_class_teachers_validity"
        ON "school_class_teachers" ("school_class_id", "valid_from", "valid_to")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_school_class_teachers_validity"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_school_class_teachers_org"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_school_class_teachers_open"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_class_teachers" DROP CONSTRAINT IF EXISTS "pk_school_class_teachers"`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "school_class_teachers"
          ADD CONSTRAINT "PK_e25cc1dc4832a79090dfc11c637"
          PRIMARY KEY ("school_class_id", "employee_id");
      EXCEPTION WHEN others THEN null; END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "school_class_teachers"
        DROP CONSTRAINT IF EXISTS "chk_school_class_teachers_validity",
        DROP CONSTRAINT IF EXISTS "chk_school_class_teachers_workload",
        DROP CONSTRAINT IF EXISTS "fk_school_class_teachers_org",
        DROP COLUMN IF EXISTS "organization_id",
        DROP COLUMN IF EXISTS "valid_to",
        DROP COLUMN IF EXISTS "valid_from",
        DROP COLUMN IF EXISTS "workload_percent",
        DROP COLUMN IF EXISTS "role",
        DROP COLUMN IF EXISTS "deletedAt",
        DROP COLUMN IF EXISTS "updatedAt",
        DROP COLUMN IF EXISTS "createdAt",
        DROP COLUMN IF EXISTS "isArchived",
        DROP COLUMN IF EXISTS "isActive",
        DROP COLUMN IF EXISTS "version",
        DROP COLUMN IF EXISTS "id"
    `);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."school_class_teachers_role_enum"`,
    );
  }
}
