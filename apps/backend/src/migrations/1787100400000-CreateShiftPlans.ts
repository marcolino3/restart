import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Coverage requirements (team x shift x weekday), shift plans and their
 * assignments. Also adds the SHIFT_PLAN_READ / SHIFT_PLAN_WRITE enum values;
 * seeding them happens in BackfillShiftPlanPermissions (PG16 55P04 rule).
 */
export class CreateShiftPlans1787100400000 implements MigrationInterface {
  name = 'CreateShiftPlans1787100400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shift_coverage_requirements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "team_id" uuid NOT NULL,
        "shift_id" uuid NOT NULL,
        "weekday" character varying(3) NOT NULL,
        "required_count" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_shift_coverage_requirements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shift_coverage_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shift_coverage_team" FOREIGN KEY ("team_id")
          REFERENCES "teams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shift_coverage_shift" FOREIGN KEY ("shift_id")
          REFERENCES "shifts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_shift_coverage" ON "shift_coverage_requirements" ("team_id", "shift_id", "weekday")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shift_coverage_org_team" ON "shift_coverage_requirements" ("organization_id", "team_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shift_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "team_id" uuid NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'DRAFT',
        "source" character varying(16) NOT NULL DEFAULT 'MANUAL',
        "created_by_membership_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shift_plans" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_shift_plans_period" CHECK ("end_date" >= "start_date"),
        CONSTRAINT "FK_shift_plans_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shift_plans_team" FOREIGN KEY ("team_id")
          REFERENCES "teams"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shift_plans_org_team" ON "shift_plans" ("organization_id", "team_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shift_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "date" date NOT NULL,
        "shift_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        CONSTRAINT "PK_shift_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shift_assignments_org" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shift_assignments_plan" FOREIGN KEY ("plan_id")
          REFERENCES "shift_plans"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shift_assignments_shift" FOREIGN KEY ("shift_id")
          REFERENCES "shifts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shift_assignments_employee" FOREIGN KEY ("employee_id")
          REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_shift_assignment" ON "shift_assignments" ("plan_id", "date", "shift_id", "employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shift_assignments_org_employee_date" ON "shift_assignments" ("organization_id", "employee_id", "date")`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'SHIFT_PLAN_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'SHIFT_PLAN_WRITE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_plans"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "shift_coverage_requirements"`,
    );
    // Enum values cannot be dropped in PostgreSQL; they stay.
  }
}
