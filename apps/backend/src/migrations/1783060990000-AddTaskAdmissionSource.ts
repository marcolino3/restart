import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Links an admission reminder ("Erinnerung") to a personal task so reminders are
 * also recorded under "My Tasks" with a reference back to their source. Mirrors
 * the tasks.protocol_id back-reference (ON DELETE SET NULL). `admission_application_id`
 * keeps the source visible even if the reminder itself is later removed.
 */
export class AddTaskAdmissionSource1783060990000 implements MigrationInterface {
  name = 'AddTaskAdmissionSource1783060990000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "admission_reminder_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "admission_application_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_admission_reminder" ON "tasks" ("admission_reminder_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_admission_application" ON "tasks" ("admission_application_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_admission_reminder" FOREIGN KEY ("admission_reminder_id") REFERENCES "admission_reminders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_admission_application" FOREIGN KEY ("admission_application_id") REFERENCES "admission_applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_admission_application"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_admission_reminder"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_tasks_admission_application"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_tasks_admission_reminder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "admission_application_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "admission_reminder_id"`,
    );
  }
}
