import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-employee opt-in assignment for company vacations that don't apply to all
 * employees (appliesToAll=false).
 */
export class CompanyVacationAssignments1786040000000 implements MigrationInterface {
  name = 'CompanyVacationAssignments1786040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_vacation_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "company_vacation_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        CONSTRAINT "pk_company_vacation_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_company_vacation_assignments_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_company_vacation_assignments_vacation" FOREIGN KEY ("company_vacation_id")
          REFERENCES "company_vacations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_company_vacation_assignments_employee" FOREIGN KEY ("employee_id")
          REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_company_vacation_assignment" ON "company_vacation_assignments" ("company_vacation_id", "employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_company_vacation_assignments_employee" ON "company_vacation_assignments" ("employee_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "company_vacation_assignments"`,
    );
  }
}
