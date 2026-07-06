import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Design-Abgleich Projektmanagement:
 * - projects.due_date — optionales Zieldatum ("Fällig" in Liste/Dialog).
 * - tasks.due_time — optionale Uhrzeit zur Fälligkeit (HH:MM).
 * - tasks.completed_at — gesetzt beim Übergang nach DONE; treibt den
 *   "Erledigte Aufgaben"-Bereich (30-Tage-Fenster) in "Meine Aufgaben".
 * - tasks.checklist / tasks.notes — Checkliste und Notizen im Aufgaben-Dialog
 *   (JSONB, untergeordnete Daten ohne eigene Identität — wie Protocol.sections).
 *
 * Backfill: bereits erledigte Aufgaben erhalten updatedAt als completed_at,
 * damit sie im 30-Tage-Fenster nicht sofort verschwinden.
 */
export class AddPmDesignFields1783061010000 implements MigrationInterface {
  name = 'AddPmDesignFields1783061010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "due_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "due_time" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "checklist" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "notes" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `UPDATE "tasks" SET "completed_at" = "updatedAt" WHERE "status" = 'DONE' AND "completed_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "notes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "checklist"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "completed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "due_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "due_date"`,
    );
  }
}
