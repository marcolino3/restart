import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdmissionRejectionReasons1779201500000 implements MigrationInterface {
  name = 'AdmissionRejectionReasons1779201500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Org-configurable list of rejection reasons.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_rejection_reasons" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "label" text NOT NULL,
        "color" text,
        "position" integer NOT NULL DEFAULT 0,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "pk_admission_rejection_reasons" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_rejection_reasons_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admission_rejection_reasons_org" ON "admission_rejection_reasons" ("organization_id")`,
    );

    // Link an application to a configured rejection reason (free text stays).
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD COLUMN IF NOT EXISTS "rejection_reason_id" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "admission_applications"
        ADD CONSTRAINT "fk_admission_applications_rejection_reason"
        FOREIGN KEY ("rejection_reason_id")
        REFERENCES "admission_rejection_reasons"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP CONSTRAINT IF EXISTS "fk_admission_applications_rejection_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP COLUMN IF EXISTS "rejection_reason_id"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "admission_rejection_reasons"`,
    );
  }
}
