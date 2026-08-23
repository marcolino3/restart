import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Approval workflow for absences: categories with `requires_approval` create
 * PENDING requests that a lead/HR/admin approves or rejects. Existing rows
 * become APPROVED — they were definitive before this migration.
 */
export class AddEmployeeAbsenceApprovalStatus1786700000000 implements MigrationInterface {
  name = 'AddEmployeeAbsenceApprovalStatus1786700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "status" varchar(16) NOT NULL DEFAULT 'APPROVED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "requested_at" timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "decided_at" timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "decided_by_membership_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" ADD COLUMN IF NOT EXISTS "decision_note" text`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employee_absences_decided_by_membership') THEN
          ALTER TABLE "employee_absences"
            ADD CONSTRAINT "fk_employee_absences_decided_by_membership"
            FOREIGN KEY ("decided_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL;
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_employee_absences_org_status" ON "employee_absences" ("organization_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_employee_absences_org_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_absences" DROP CONSTRAINT IF EXISTS "fk_employee_absences_decided_by_membership"`,
    );
    for (const col of [
      'decision_note',
      'decided_by_membership_id',
      'decided_at',
      'requested_at',
      'status',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "employee_absences" DROP COLUMN IF EXISTS "${col}"`,
      );
    }
  }
}
