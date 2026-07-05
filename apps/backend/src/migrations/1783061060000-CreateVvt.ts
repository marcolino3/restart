import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Record of processing activities (Art. 30) + subprocessor register (Art. 28).
 * Org-configurable documentation. Registers the VVT_* permission codes; catalog
 * + role rows are seeded in the next migration (55P04).
 */
export class CreateVvt1783061060000 implements MigrationInterface {
  name = 'CreateVvt1783061060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."processing_activities_legal_basis_enum" AS ENUM('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTEREST', 'PUBLIC_TASK', 'LEGITIMATE_INTEREST')`,
    );

    await queryRunner.query(
      `CREATE TABLE "processing_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text NOT NULL, "purpose" text, "legal_basis" "public"."processing_activities_legal_basis_enum" NOT NULL DEFAULT 'CONSENT', "data_categories" text, "data_subjects" text, "recipients" text, "retention_note" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_processing_activities" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_processing_activities_org" ON "processing_activities" ("organization_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "processing_activities" ADD CONSTRAINT "FK_processing_activities_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "subprocessors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "name" text NOT NULL, "purpose" text, "country" text, "dpa_signed" boolean NOT NULL DEFAULT false, "url" text, "notes" text, "organization_id" uuid NOT NULL, CONSTRAINT "PK_subprocessors" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subprocessors_org" ON "subprocessors" ("organization_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "subprocessors" ADD CONSTRAINT "FK_subprocessors_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // --- Permission codes (values only; seeded in the next migration) ---
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'VVT_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'VVT_MANAGE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subprocessors"`);
    await queryRunner.query(`DROP TABLE "processing_activities"`);
    await queryRunner.query(
      `DROP TYPE "public"."processing_activities_legal_basis_enum"`,
    );
  }
}
