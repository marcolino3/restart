import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `admission_reminders.notified_at` — the timestamp at which the daily
 * notifier cron emailed the reminder's assignee. `null` = not yet notified.
 * Guarantees a due reminder is mailed at most once (no daily re-send).
 *
 * Forward-only / expand: nullable column, no destructive change. A partial
 * index over open, unnotified reminders keeps the cron's due-scan cheap.
 */
export class AddAdmissionReminderNotifiedAt1783061200000 implements MigrationInterface {
  name = 'AddAdmissionReminderNotifiedAt1783061200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_reminders"
        ADD COLUMN IF NOT EXISTS "notified_at" timestamptz
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_admission_reminders_pending_notify"
        ON "admission_reminders" ("due_at")
        WHERE "completed_at" IS NULL AND "notified_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_admission_reminders_pending_notify"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_reminders" DROP COLUMN IF EXISTS "notified_at"`,
    );
  }
}
