import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-absence calendar options chosen in the self-service form: whether the
 * absence is mirrored to the organization calendar at all and an optional
 * title template (`{firstName} {lastName} {category}`) for that event.
 */
export class AddAbsenceCalendarOptions1786900000000 implements MigrationInterface {
  name = 'AddAbsenceCalendarOptions1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "sync_to_calendar" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "calendar_title" varchar(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "calendar_title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "sync_to_calendar"`,
    );
  }
}
