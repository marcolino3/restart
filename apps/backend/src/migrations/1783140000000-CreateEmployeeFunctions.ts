import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Org-configurable employee job functions (Funktionen) used in contracts /
 * onboarding. Mirrors admission_appointment_types: AbstractEntity base columns,
 * sort_order, archive flag, org-scoped with CASCADE.
 */
export class CreateEmployeeFunctions1783140000000 implements MigrationInterface {
  name = 'CreateEmployeeFunctions1783140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_functions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "name" varchar(200) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "pk_employee_functions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_employee_functions_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_employee_functions_org" ON "employee_functions" ("organization_id")`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employee_function_org_name" ON "employee_functions" ("organization_id", "name")`,
    );

    const defaults = [
      'Klassenleitung',
      'Lehrperson',
      'Assistenz',
      'Pädagog:in Kinderhaus',
      'Sekretariat',
      'Schulleitung',
    ];

    for (const [index, name] of defaults.entries()) {
      await queryRunner.query(
        `
        INSERT INTO "employee_functions" (
          "name", "sort_order", "organization_id"
        )
        SELECT $1::varchar, $2::integer, o."id"
        FROM "organizations" o
        WHERE NOT EXISTS (
          SELECT 1 FROM "employee_functions" ef
          WHERE ef."organization_id" = o."id"
            AND ef."name" = $3::varchar
        )
        `,
        [name, index, name],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_functions"`);
  }
}
