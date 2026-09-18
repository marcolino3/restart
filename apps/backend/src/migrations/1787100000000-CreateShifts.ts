import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Org-wide work shifts and their assignment to teams (shift planning, phase 1).
 * Also adds the SHIFT_MANAGE permission code to the enum — the value is used
 * (seeded + granted) in the follow-up BackfillShiftPermissions migration, since
 * PG16 refuses to use a freshly added enum value in the same transaction
 * (55P04) and migrationsTransactionMode is 'each'.
 */
export class CreateShifts1787100000000 implements MigrationInterface {
  name = 'CreateShifts1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shifts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "name" varchar(120) NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "color" varchar(7),
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_shifts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shifts_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_shift_org_name" ON "shifts" ("organization_id", "name")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "team_shifts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "team_id" uuid NOT NULL,
        "shift_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_team_shifts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_team_shifts_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_shifts_team" FOREIGN KEY ("team_id")
          REFERENCES "teams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_shifts_shift" FOREIGN KEY ("shift_id")
          REFERENCES "shifts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_team_shift" ON "team_shifts" ("team_id", "shift_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_team_shifts_org_shift" ON "team_shifts" ("organization_id", "shift_id")`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'SHIFT_MANAGE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "team_shifts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shifts"`);
    // Enum values cannot be dropped in Postgres; SHIFT_MANAGE stays in the type.
  }
}
