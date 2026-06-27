import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Project-management module (Monday.com-style boards): projects, their members
 * (with OWNER/MEMBER role), tasks, and multi-assignee task assignments.
 *
 * Also registers the four new permission codes on the existing
 * `permissions_code_enum` type. The catalog rows and role assignments are
 * seeded in a *separate* migration (BackfillProjectPermissions) because a new
 * enum value may not be used in the same transaction it is added in.
 *
 * Forward-only / expand (see CLAUDE.md): the down path exists for local dev.
 */
export class CreateProjectManagement1779201800000 implements MigrationInterface {
  name = 'CreateProjectManagement1779201800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Enum types -------------------------------------------------------
    await queryRunner.query(
      `CREATE TYPE "public"."projects_status_enum" AS ENUM('ACTIVE', 'ON_HOLD', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_members_role_enum" AS ENUM('OWNER', 'MEMBER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_status_enum" AS ENUM('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')`,
    );

    // --- projects ---------------------------------------------------------
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "title" text NOT NULL, "description" text, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'ACTIVE', "color" text, "organization_id" uuid NOT NULL, "created_by_membership_id" uuid, CONSTRAINT "PK_projects" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_projects_org" ON "projects" ("organization_id") `,
    );

    // --- project_members --------------------------------------------------
    await queryRunner.query(
      `CREATE TABLE "project_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "membership_id" uuid NOT NULL, "role" "public"."project_members_role_enum" NOT NULL DEFAULT 'MEMBER', CONSTRAINT "PK_project_members" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_project_member_project_membership" ON "project_members" ("project_id", "membership_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_project_members_membership" ON "project_members" ("membership_id") `,
    );

    // --- tasks ------------------------------------------------------------
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "title" text NOT NULL, "description" text, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'OPEN', "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM', "due_date" date, "sort_order" integer NOT NULL DEFAULT '0', "organization_id" uuid NOT NULL, "project_id" uuid NOT NULL, "created_by_membership_id" uuid, CONSTRAINT "PK_tasks" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_org" ON "tasks" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_project" ON "tasks" ("project_id") `,
    );

    // --- task_assignees ---------------------------------------------------
    await queryRunner.query(
      `CREATE TABLE "task_assignees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "task_id" uuid NOT NULL, "membership_id" uuid NOT NULL, CONSTRAINT "PK_task_assignees" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_task_assignee_task_membership" ON "task_assignees" ("task_id", "membership_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_assignees_membership" ON "task_assignees" ("membership_id") `,
    );

    // --- Foreign keys -----------------------------------------------------
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_created_by" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_project_members_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_project_members_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_project_members_membership" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_created_by" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_task_assignees_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_task_assignees_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_task_assignees_membership" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // --- Permission codes (values only; seeded in the next migration) -----
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'PROJECT_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'PROJECT_CREATE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'PROJECT_MANAGE_ALL'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'PROJECT_TEMPLATE_MANAGE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "task_assignees"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."project_members_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
    // PostgreSQL cannot remove values from an enum type; the four permission
    // codes remain on permissions_code_enum (forward-only).
  }
}
