import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Calendar options are an admin decision per absence category, not a choice
 * the employee makes per absence: whether absences of this category are
 * mirrored to the organization calendar and which event title template
 * (`{firstName} {lastName} {category}`) is used. Moves the two columns from
 * `employee_absences` to `employee_absence_categories`.
 */
export class MoveCalendarOptionsToAbsenceCategory1786900300000 implements MigrationInterface {
  name = 'MoveCalendarOptionsToAbsenceCategory1786900300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" ADD COLUMN IF NOT EXISTS "sync_to_calendar" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" ADD COLUMN IF NOT EXISTS "calendar_title_template" varchar(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "calendar_title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "sync_to_calendar"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "sync_to_calendar" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "calendar_title" varchar(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" DROP COLUMN IF EXISTS "calendar_title_template"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absence_categories" DROP COLUMN IF EXISTS "sync_to_calendar"`,
    );
  }
}
