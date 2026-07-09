import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `sort_order` to contact persons so they can be ordered within a family.
 * The lowest sort_order is treated as the primary contact (shown on the
 * admission "Angaben" card). Forward-only / additive; existing rows default to
 * 0, then get a stable per-family ordering by creation time so the first-created
 * contact stays primary.
 */
export class AddContactPersonSortOrder1783061400000 implements MigrationInterface {
  name = 'AddContactPersonSortOrder1783061400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact_persons" ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0`,
    );
    // Seed a deterministic order per family by creation time so existing
    // contacts keep a stable primary (row 0) instead of all sharing 0.
    await queryRunner.query(`
      UPDATE "contact_persons" c
      SET "sort_order" = o.rn
      FROM (
        SELECT "id",
               ROW_NUMBER() OVER (
                 PARTITION BY "family_id" ORDER BY "createdAt" ASC, "id" ASC
               ) - 1 AS rn
        FROM "contact_persons"
        WHERE "family_id" IS NOT NULL
      ) o
      WHERE c."id" = o."id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact_persons" DROP COLUMN IF EXISTS "sort_order"`,
    );
  }
}
