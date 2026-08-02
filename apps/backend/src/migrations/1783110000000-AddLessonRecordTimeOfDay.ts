import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `recorded_at` was date-only, so the UI had no real time to show — the
 * table rendered it via `new Date("YYYY-MM-DD")`, which anchors at UTC
 * midnight and displayed as 01:00/02:00 in CH timezones. Widening the
 * column to `timestamptz` lets the entry form capture a real time (default:
 * now) while every existing consumer (heatmap, attention windows, lifecycle
 * diffing) keeps working unchanged — they only ever read the date part.
 *
 * Existing rows have no recorded time — it was never captured, so it cannot
 * be recovered; `createdAt` only says when someone typed, not when the lesson
 * happened. They are backfilled to 09:00 *local* time, matching the default
 * slot the entry form picks for a fresh record. Anything near midnight is one
 * keystroke away from rolling onto the wrong calendar day once rendered in a
 * UTC+1/+2 timezone, which would silently move historic entries into the
 * "yesterday" bucket in the heatmap/attention aggregations.
 *
 * The cast goes through `AT TIME ZONE 'Europe/Zurich'` rather than adding a
 * fixed interval: a plain `+ interval '9 hours'` is applied in UTC and would
 * land on 11:00 local in summer and 10:00 in winter. Routing through the zone
 * keeps DST handled per row.
 */
export class AddLessonRecordTimeOfDay1783110000000 implements MigrationInterface {
  name = 'AddLessonRecordTimeOfDay1783110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        ALTER COLUMN "recorded_at" TYPE timestamptz
        USING (("recorded_at"::date + TIME '09:00') AT TIME ZONE 'Europe/Zurich')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lesson_records"
        ALTER COLUMN "recorded_at" TYPE date
        USING ("recorded_at"::date)
    `);
  }
}
