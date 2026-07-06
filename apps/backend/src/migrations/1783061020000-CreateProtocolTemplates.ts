import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Protokollvorlagen (Traktanden-Struktur + Standard-Teilnehmende) und das
 * optionale Sitzungszeitfenster (start_time/end_time) auf Protokollen.
 * Keine neuen Permission-Codes — Vorlagen laufen unter PROTOCOL_READ/WRITE.
 */
export class CreateProtocolTemplates1783061020000 implements MigrationInterface {
  name = 'CreateProtocolTemplates1783061020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "protocol_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "title" text NOT NULL, "agenda_items" jsonb NOT NULL DEFAULT '[]', "default_participant_membership_ids" jsonb NOT NULL DEFAULT '[]', "used_count" integer NOT NULL DEFAULT 0, "organization_id" uuid NOT NULL, "created_by_membership_id" uuid, CONSTRAINT "PK_protocol_templates" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_protocol_templates_org" ON "protocol_templates" ("organization_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "protocol_templates" ADD CONSTRAINT "FK_protocol_templates_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocol_templates" ADD CONSTRAINT "FK_protocol_templates_created_by" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "start_time" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "end_time" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "protocols" DROP COLUMN IF EXISTS "end_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocols" DROP COLUMN IF EXISTS "start_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocol_templates" DROP CONSTRAINT IF EXISTS "FK_protocol_templates_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocol_templates" DROP CONSTRAINT IF EXISTS "FK_protocol_templates_org"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_protocol_templates_org"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "protocol_templates"`);
  }
}
