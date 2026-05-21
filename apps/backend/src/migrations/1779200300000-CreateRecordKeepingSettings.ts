import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecordKeepingSettings1779200300000 implements MigrationInterface {
  name = 'CreateRecordKeepingSettings1779200300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "record_keeping_settings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "introduced_stuck_days" integer NOT NULL DEFAULT 30,
        "practiced_stuck_days" integer NOT NULL DEFAULT 90,
        "big_gap_days" integer NOT NULL DEFAULT 60,
        CONSTRAINT "pk_record_keeping_settings" PRIMARY KEY ("id"),
        CONSTRAINT "fk_record_keeping_settings_organization"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_record_keeping_settings_org"
        ON "record_keeping_settings" ("organization_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "record_keeping_settings"`);
  }
}
