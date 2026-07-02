import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Project templates: reusable structures for recurring school processes
 * ("Schuljahresanfang", "Elternabend", …). A template holds an ordered list of
 * template tasks (with optional relative due offset and a stored default
 * assignee role). Reuses the existing tasks_priority_enum and
 * roles_system_code_enum types.
 *
 * Forward-only / expand (see CLAUDE.md); down path exists for local dev.
 */
export class CreateProjectTemplates1779201800002 implements MigrationInterface {
  name = 'CreateProjectTemplates1779201800002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "title" text NOT NULL, "description" text, "organization_id" uuid NOT NULL, "created_by_membership_id" uuid, CONSTRAINT "PK_project_templates" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_project_templates_org" ON "project_templates" ("organization_id") `,
    );

    await queryRunner.query(
      `CREATE TABLE "project_template_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "template_id" uuid NOT NULL, "title" text NOT NULL, "description" text, "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM', "sort_order" integer NOT NULL DEFAULT '0', "due_offset_days" integer, "default_assignee_role" "public"."roles_system_code_enum", CONSTRAINT "PK_project_template_tasks" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_project_template_tasks_template" ON "project_template_tasks" ("template_id") `,
    );

    await queryRunner.query(
      `ALTER TABLE "project_templates" ADD CONSTRAINT "FK_project_templates_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_templates" ADD CONSTRAINT "FK_project_templates_created_by" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_template_tasks" ADD CONSTRAINT "FK_project_template_tasks_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_template_tasks" ADD CONSTRAINT "FK_project_template_tasks_template" FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "project_template_tasks"`);
    await queryRunner.query(`DROP TABLE "project_templates"`);
  }
}
