import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdmissionApplications1779200900000 implements MigrationInterface {
  name = 'CreateAdmissionApplications1779200900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------------------------------------------------------------------
    // families
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "families" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "name" text,
        "primary_address_id" uuid,
        "notes" text,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "pk_families" PRIMARY KEY ("id"),
        CONSTRAINT "fk_families_organization"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_families_primary_address"
          FOREIGN KEY ("primary_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_families_org" ON "families" ("organization_id")`,
    );

    // ---------------------------------------------------------------------
    // contact_persons.family_id
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      ALTER TABLE "contact_persons"
        ADD COLUMN IF NOT EXISTS "family_id" uuid
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_contact_persons_family'
        ) THEN
          ALTER TABLE "contact_persons"
            ADD CONSTRAINT "fk_contact_persons_family"
              FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_contact_persons_family" ON "contact_persons" ("family_id")`,
    );

    // ---------------------------------------------------------------------
    // admission_applications
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admission_applications_status_enum') THEN
          CREATE TYPE "admission_applications_status_enum" AS ENUM (
            'ACTIVE', 'REJECTED', 'ENROLLED', 'ARCHIVED'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admission_applications_source_enum') THEN
          CREATE TYPE "admission_applications_source_enum" AS ENUM (
            'MANUAL', 'PUBLIC_FORM', 'OPEN_DAY', 'REFERRAL', 'OTHER'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admission_applications_child_gender_enum') THEN
          CREATE TYPE "admission_applications_child_gender_enum" AS ENUM (
            'MALE', 'FEMALE', 'OTHER'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_applications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "family_id" uuid NOT NULL,
        "admission_stage_id" uuid NOT NULL,
        "child_first_name" text NOT NULL,
        "child_last_name" text NOT NULL,
        "child_date_of_birth" date,
        "child_gender" "admission_applications_child_gender_enum",
        "child_notes" text,
        "desired_grade_level_id" uuid,
        "desired_school_class_id" uuid,
        "desired_enrollment_date" date,
        "status" "admission_applications_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "source" "admission_applications_source_enum" NOT NULL DEFAULT 'MANUAL',
        "enrolled_student_id" uuid,
        "stage_entered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "position" integer NOT NULL DEFAULT 0,
        "rejection_reason" text,
        CONSTRAINT "pk_admission_applications" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_apps_organization"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_apps_family"
          FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_admission_apps_stage"
          FOREIGN KEY ("admission_stage_id") REFERENCES "admission_stages"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_admission_apps_grade_level"
          FOREIGN KEY ("desired_grade_level_id") REFERENCES "grade_levels"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_admission_apps_school_class"
          FOREIGN KEY ("desired_school_class_id") REFERENCES "school_classes"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_admission_apps_student"
          FOREIGN KEY ("enrolled_student_id") REFERENCES "students"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_apps_org" ON "admission_applications" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_apps_family" ON "admission_applications" ("family_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_apps_stage" ON "admission_applications" ("admission_stage_id")`,
    );
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_admission_apps_org_stage_position"
        ON "admission_applications" ("organization_id", "admission_stage_id", "position")
    `);

    // ---------------------------------------------------------------------
    // students.admission_application_id
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD COLUMN IF NOT EXISTS "admission_application_id" uuid
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_admission_application'
        ) THEN
          ALTER TABLE "students"
            ADD CONSTRAINT "fk_students_admission_application"
              FOREIGN KEY ("admission_application_id") REFERENCES "admission_applications"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `);

    // ---------------------------------------------------------------------
    // admission_audit_logs
    // ---------------------------------------------------------------------
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admission_audit_logs_action_enum') THEN
          CREATE TYPE "admission_audit_logs_action_enum" AS ENUM (
            'CREATED', 'STAGE_CHANGED', 'FIELD_UPDATED', 'CONTACT_ADDED',
            'CONTACT_REMOVED', 'NOTE_ADDED', 'FORM_SUBMITTED', 'ENROLLED',
            'REJECTED', 'ARCHIVED', 'RESTORED'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "actor_membership_id" uuid,
        "action" "admission_audit_logs_action_enum" NOT NULL,
        "from_stage_id" uuid,
        "to_stage_id" uuid,
        "field_name" varchar(120),
        "old_value" text,
        "new_value" text,
        "metadata" jsonb,
        CONSTRAINT "pk_admission_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_audit_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_audit_app"
          FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_audit_actor"
          FOREIGN KEY ("actor_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_admission_audit_from_stage"
          FOREIGN KEY ("from_stage_id") REFERENCES "admission_stages"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_admission_audit_to_stage"
          FOREIGN KEY ("to_stage_id") REFERENCES "admission_stages"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_audit_logs_org" ON "admission_audit_logs" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_audit_logs_app" ON "admission_audit_logs" ("application_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_audit_logs"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admission_audit_logs_action_enum"`,
    );
    await queryRunner.query(`
      ALTER TABLE "students"
        DROP CONSTRAINT IF EXISTS "fk_students_admission_application"
    `);
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "admission_application_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_applications"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admission_applications_child_gender_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admission_applications_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admission_applications_status_enum"`,
    );
    await queryRunner.query(`
      ALTER TABLE "contact_persons"
        DROP CONSTRAINT IF EXISTS "fk_contact_persons_family"
    `);
    await queryRunner.query(
      `ALTER TABLE "contact_persons" DROP COLUMN IF EXISTS "family_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "families"`);
  }
}
