import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Team nesting (adjacency list via teams.parent_id) and per-team member roles
 * (team_members.role: MEMBER | LEAD).
 *
 * Forward-only / expand: adds nullable column + enum column with safe defaults,
 * no destructive change to existing rows. Enum type name mirrors the TypeORM
 * synchronize default (`{table}_{column}_enum`) to avoid schema drift in dev.
 */
export class TeamHierarchyAndLeads1779201500000 implements MigrationInterface {
  name = 'TeamHierarchyAndLeads1779201500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // teams: self-referencing parent for nesting (adjacency list).
    await queryRunner.query(`
      ALTER TABLE "teams"
        ADD COLUMN IF NOT EXISTS "parent_id" uuid
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "teams"
          ADD CONSTRAINT "fk_teams_parent"
          FOREIGN KEY ("parent_id") REFERENCES "teams"("id")
          ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teams_parent" ON "teams" ("parent_id")
    `);

    // team_members: role (MEMBER | LEAD), default MEMBER for all existing rows.
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "team_members_role_enum" AS ENUM ('MEMBER', 'LEAD');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "team_members"
        ADD COLUMN IF NOT EXISTS "role" "team_members_role_enum"
        NOT NULL DEFAULT 'MEMBER'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP COLUMN IF EXISTS "role"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "team_members_role_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_teams_parent"`);
    await queryRunner.query(
      `ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "fk_teams_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" DROP COLUMN IF EXISTS "parent_id"`,
    );
  }
}
