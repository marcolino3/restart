import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Employee onboarding wizard: concrete working time windows per weekday
 * (Mo 08:00–12:00, …), stored as jsonb. When present, the work-time engine
 * derives the daily planned minutes from the summed window durations instead of
 * the percentage-based weekdayWorkloads. Structure:
 *   { mon: [{ start: "08:00", end: "12:00" }], … }
 */
export class AddContractWeekdayTimeWindows1783060930000
  implements MigrationInterface
{
  name = 'AddContractWeekdayTimeWindows1783060930000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" ADD "weekday_time_windows" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_contracts" DROP COLUMN "weekday_time_windows"`,
    );
  }
}
