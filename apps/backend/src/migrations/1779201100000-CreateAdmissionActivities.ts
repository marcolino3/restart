import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdmissionActivities1779201100000 implements MigrationInterface {
  name = 'CreateAdmissionActivities1779201100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admission_activities_type_enum') THEN
          CREATE TYPE "admission_activities_type_enum" AS ENUM (
            'CALL', 'EMAIL', 'MEETING', 'NOTE'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admission_activities_direction_enum') THEN
          CREATE TYPE "admission_activities_direction_enum" AS ENUM (
            'INBOUND', 'OUTBOUND'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_activities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "type" "admission_activities_type_enum" NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "subject" varchar(200),
        "body" text,
        "direction" "admission_activities_direction_enum",
        "duration_minutes" integer,
        "location" varchar(200),
        "created_by_membership_id" uuid,
        CONSTRAINT "pk_admission_activities" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_activities_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_activities_app"
          FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_activities_membership"
          FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_activities_org" ON "admission_activities" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_activities_app_occurred" ON "admission_activities" ("application_id", "occurred_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_activities"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admission_activities_direction_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admission_activities_type_enum"`,
    );
  }
}
