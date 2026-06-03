import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdmissionCardAndBoardSettings1779201400000
  implements MigrationInterface
{
  name = 'AdmissionCardAndBoardSettings1779201400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Per-stage card field selection (Kanban cards).
    await queryRunner.query(
      `ALTER TABLE "admission_stages" ADD COLUMN IF NOT EXISTS "card_fields" jsonb`,
    );

    // Org-global admissions board UI settings (table columns).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission_board_settings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "table_columns" jsonb,
        CONSTRAINT "pk_admission_board_settings" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admission_board_settings_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_admission_board_settings_org" ON "admission_board_settings" ("organization_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admission_board_settings"`);
    await queryRunner.query(
      `ALTER TABLE "admission_stages" DROP COLUMN IF EXISTS "card_fields"`,
    );
  }
}
