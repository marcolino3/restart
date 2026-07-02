import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds composite indexes on org-scoped tables that the time-tracking engine and
 * HR views filter by organization + employee (+ date range) on every request.
 * Postgres does not auto-index foreign keys, so these tables were seq-scanned
 * and degraded linearly with data growth.
 *
 * Forward-only: `down()` only drops the added indexes (no data change).
 */
export class AddHotTableIndexes1779202100000 implements MigrationInterface {
  name = 'AddHotTableIndexes1779202100000';

  private readonly indexes: { name: string; table: string; columns: string }[] =
    [
      // Absences: engine queries per org+employee, filtered by date range.
      {
        name: 'idx_employee_absences_org_employee',
        table: 'employee_absences',
        columns: '"organization_id", "employee_id"',
      },
      {
        name: 'idx_employee_absences_employee_start',
        table: 'employee_absences',
        columns: '"employee_id", "startDate"',
      },
      // Absence days: the per-day ledger lookups (org+employee+date).
      {
        name: 'idx_employee_absence_days_org_employee_date',
        table: 'employee_absence_days',
        columns: '"organization_id", "employee_id", "date"',
      },
      // Contracts: active-contract resolution per org+employee, by date range.
      {
        name: 'idx_employee_contracts_org_employee',
        table: 'employee_contracts',
        columns: '"organization_id", "employee_id"',
      },
      {
        name: 'idx_employee_contracts_employee_start',
        table: 'employee_contracts',
        columns: '"employee_id", "start_date"',
      },
      // HR/notes lists per org+subject.
      {
        name: 'idx_employee_notes_org_employee',
        table: 'employee_notes',
        columns: '"organization_id", "employee_id"',
      },
      {
        name: 'idx_student_notes_org_student',
        table: 'student_notes',
        columns: '"organization_id", "student_id"',
      },
      // Time-tracking period-scoped tables (org index missing).
      {
        name: 'idx_employee_period_opening_balances_org_employee',
        table: 'employee_period_opening_balances',
        columns: '"organization_id", "employee_id"',
      },
      {
        name: 'idx_employee_paid_overtime_org_employee_date',
        table: 'employee_paid_overtime',
        columns: '"organization_id", "employee_id", "date"',
      },
    ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const idx of this.indexes) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${idx.name}" ON "${idx.table}" (${idx.columns})`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const idx of this.indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${idx.name}"`);
    }
  }
}
