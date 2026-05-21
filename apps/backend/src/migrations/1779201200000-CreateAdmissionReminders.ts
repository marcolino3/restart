import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdmissionReminders1779201200000 implements MigrationInterface {
  name = 'CreateAdmissionReminders1779201200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_reminders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "due_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "title" varchar(200) NOT NULL,
        "note" text,
        "assigned_to_membership_id" uuid,
        "created_by_membership_id" uuid,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "completed_by_membership_id" uuid,
        CONSTRAINT "pk_admission_reminders" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_reminders_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_reminders_app"
          FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_admission_reminders_assignee"
          FOREIGN KEY ("assigned_to_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_admission_reminders_creator"
          FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_admission_reminders_completer"
          FOREIGN KEY ("completed_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_reminders_org_due" ON "admission_reminders" ("organization_id", "due_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_reminders_app" ON "admission_reminders" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_reminders_assignee_due" ON "admission_reminders" ("assigned_to_membership_id", "due_at")`,
    );
    // Speed up "open reminders" sweeps without scanning completed rows.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_reminders_open" ON "admission_reminders" ("organization_id", "due_at") WHERE "completed_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_reminders"`);
  }
}
