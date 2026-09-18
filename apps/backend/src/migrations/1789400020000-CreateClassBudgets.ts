import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Class budgets. Creates three org-scoped tables:
 *   - expense_categories (org-managed category list, like student_record_categories)
 *   - class_budgets      (one amount per class per school year)
 *   - class_expenses     (expense entries recorded by the class teachers)
 *
 * A budget is keyed by `school_year_start` (2026 for "2026/27") because it has
 * no date of its own. Expenses are NOT stamped with a school year — they are
 * matched by `expense_date` against the range derived from the org's cut-off
 * (`organizations.school_year_start_month/day`), like everything else that is
 * school-year aware.
 *
 * Forward-only / additive. AbstractEntity columns mirror CreateStudentRecords.
 */
export class CreateClassBudgets1789400020000 implements MigrationInterface {
  name = 'CreateClassBudgets1789400020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expense_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "name" text NOT NULL,
        "color" text,
        "position" integer NOT NULL DEFAULT 0,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "pk_expense_categories" PRIMARY KEY ("id"),
        CONSTRAINT "fk_expense_categories_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_expense_categories_org" ON "expense_categories" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_expense_categories_org_name" ON "expense_categories" ("organization_id", "name")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "class_budgets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "school_year_start" integer NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "currency" character(3) NOT NULL DEFAULT 'CHF',
        "note" text,
        CONSTRAINT "pk_class_budgets" PRIMARY KEY ("id"),
        CONSTRAINT "chk_class_budgets_amount" CHECK ("amount" >= 0),
        CONSTRAINT "fk_class_budgets_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_class_budgets_school_class"
          FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_class_budgets_org_class_year" ON "class_budgets" ("organization_id", "school_class_id", "school_year_start")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "class_expenses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "expense_date" date NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "currency" character(3) NOT NULL DEFAULT 'CHF',
        "vendor" character varying(200),
        "invoice_number" character varying(100),
        "description" text,
        "receipt_file_id" character varying(64),
        "created_by_membership_id" uuid,
        CONSTRAINT "pk_class_expenses" PRIMARY KEY ("id"),
        CONSTRAINT "chk_class_expenses_amount" CHECK ("amount" > 0),
        CONSTRAINT "fk_class_expenses_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_class_expenses_school_class"
          FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_class_expenses_category"
          FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_class_expenses_created_by"
          FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_class_expenses_org_class_date" ON "class_expenses" ("organization_id", "school_class_id", "expense_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_class_expenses_category" ON "class_expenses" ("category_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "class_expenses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "class_budgets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_categories"`);
  }
}
