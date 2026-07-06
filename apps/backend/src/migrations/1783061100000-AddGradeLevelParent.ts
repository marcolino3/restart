import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Grade-level subgroups ("Untergruppen") via an adjacency-list parent link on
 * grade_levels.parent_id. `null` = top-level Stufe; set = subgroup. Nesting is
 * limited to a single level in the application layer (GradeLevelsService).
 *
 * Forward-only / expand: adds a nullable self-referencing column with FK
 * ON DELETE SET NULL (mirrors the Team hierarchy pattern), no destructive
 * change to existing rows.
 */
export class AddGradeLevelParent1783061100000 implements MigrationInterface {
  name = 'AddGradeLevelParent1783061100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "grade_levels"
        ADD COLUMN IF NOT EXISTS "parent_id" uuid
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "grade_levels"
          ADD CONSTRAINT "fk_grade_levels_parent"
          FOREIGN KEY ("parent_id") REFERENCES "grade_levels"("id")
          ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_grade_levels_parent"
        ON "grade_levels" ("parent_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_grade_levels_parent"`);
    await queryRunner.query(
      `ALTER TABLE "grade_levels" DROP CONSTRAINT IF EXISTS "fk_grade_levels_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade_levels" DROP COLUMN IF EXISTS "parent_id"`,
    );
  }
}
