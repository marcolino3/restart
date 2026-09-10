import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Org-scoped employee contract templates: HTML body/header/footer with
 * `{{placeholder}}` tokens, resolved against a concrete contract when a
 * document is generated. Mirrors email_templates (AbstractEntity base
 * columns, org-scoped with CASCADE, created_by SET NULL).
 */
export class CreateContractTemplates1787000000000 implements MigrationInterface {
  name = 'CreateContractTemplates1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contract_templates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "organization_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "body_html" text NOT NULL,
        "header_html" text,
        "footer_html" text,
        "show_logo" boolean NOT NULL DEFAULT true,
        "description" text,
        "created_by_membership_id" uuid,
        CONSTRAINT "pk_contract_templates" PRIMARY KEY ("id"),
        CONSTRAINT "fk_contract_templates_org"
          FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_contract_templates_created_by"
          FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_contract_templates_org" ON "contract_templates" ("organization_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_templates"`);
  }
}
