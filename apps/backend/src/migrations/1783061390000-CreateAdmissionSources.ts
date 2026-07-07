import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Expand step for turning the admission "source" (Eingangskanal) from a fixed
 * PG enum into a freely manageable, org-scoped table `admission_sources`
 * (mirrors `admission_rejection_reasons`).
 *
 * Forward-only, expand/contract: this migration ADDS the table, seeds the five
 * former enum values per organization (keyed by `system_key` for a stable,
 * rename-proof mapping) and backfills each application's new nullable FK
 * `admission_source_id`. The old enum column `source` (and its PG type) stays
 * in place — it is dropped in a SEPARATE later contract migration, only once
 * the app no longer reads/writes it, so a rollback of the app code is safe.
 */
export class CreateAdmissionSources1783061390000 implements MigrationInterface {
  name = 'CreateAdmissionSources1783061390000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Org-configurable intake channels.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_sources" (
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
        "system_key" text,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "pk_admission_sources" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_sources_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_sources_org" ON "admission_sources" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_admission_sources_org_name" ON "admission_sources" ("organization_id", "name")`,
    );

    // 2) Nullable FK from applications to the chosen channel.
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD COLUMN IF NOT EXISTS "admission_source_id" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "admission_applications"
        ADD CONSTRAINT "fk_admission_applications_source"
        FOREIGN KEY ("admission_source_id")
        REFERENCES "admission_sources"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_applications_source" ON "admission_applications" ("admission_source_id")`,
    );

    // 3) Seed the five former enum values per organization (once). Keyed by
    //    `system_key` so the backfill maps deterministically even if a school
    //    later renames the channel. `ON CONFLICT` keeps it idempotent.
    await queryRunner.query(`
      INSERT INTO "admission_sources" ("name", "position", "system_key", "organization_id")
      SELECT v.name, v.pos, v.system_key, o.id
      FROM "organizations" o
      CROSS JOIN (VALUES
        ('Manuell erfasst', 0, 'MANUAL'),
        ('Online-Formular', 1, 'PUBLIC_FORM'),
        ('Tag der offenen Tür', 2, 'OPEN_DAY'),
        ('Empfehlung', 3, 'REFERRAL'),
        ('Sonstiges', 4, 'OTHER')
      ) AS v(name, pos, system_key)
      ON CONFLICT ("organization_id", "name") DO NOTHING
    `);

    // 4) Backfill: point each application at its org's channel matching the
    //    old enum value. Idempotent via the NULL guard.
    await queryRunner.query(`
      UPDATE "admission_applications" a
      SET "admission_source_id" = s.id
      FROM "admission_sources" s
      WHERE s."organization_id" = a."organization_id"
        AND s."system_key" = a."source"::text
        AND a."admission_source_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP CONSTRAINT IF EXISTS "fk_admission_applications_source"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_admission_applications_source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP COLUMN IF EXISTS "admission_source_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_sources"`);
  }
}
