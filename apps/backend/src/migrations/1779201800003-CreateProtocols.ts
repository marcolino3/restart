import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Meeting protocols (Sitzungsprotokolle). Core record + participants (org
 * members) + structured sections as JSONB (agenda, decisions, communications,
 * info points, challenges, open points). The actionable "Todos/Massnahmen" are
 * created as real tasks carrying a protocol_id back-reference (added here too).
 *
 * Registers the three PROTOCOL_* permission codes on the existing enum; the
 * catalog rows + role assignments are seeded in BackfillProtocolPermissions
 * (new enum values cannot be used in the same transaction they are added in).
 */
export class CreateProtocols1779201800003 implements MigrationInterface {
  name = 'CreateProtocols1779201800003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."protocols_status_enum" AS ENUM('DRAFT', 'FINALIZED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "protocols" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "title" text NOT NULL, "meeting_date" date, "status" "public"."protocols_status_enum" NOT NULL DEFAULT 'DRAFT', "organization_id" uuid NOT NULL, "project_id" uuid, "created_by_membership_id" uuid, "external_participants" text array NOT NULL DEFAULT '{}', "sections" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_protocols" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_protocols_org" ON "protocols" ("organization_id") `,
    );

    await queryRunner.query(
      `CREATE TABLE "protocol_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "protocol_id" uuid NOT NULL, "membership_id" uuid NOT NULL, CONSTRAINT "PK_protocol_participants" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_protocol_participant" ON "protocol_participants" ("protocol_id", "membership_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_protocol_participants_membership" ON "protocol_participants" ("membership_id") `,
    );

    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "protocol_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_protocol" ON "tasks" ("protocol_id") `,
    );

    // --- Foreign keys ---
    await queryRunner.query(
      `ALTER TABLE "protocols" ADD CONSTRAINT "FK_protocols_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocols" ADD CONSTRAINT "FK_protocols_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocols" ADD CONSTRAINT "FK_protocols_created_by" FOREIGN KEY ("created_by_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocol_participants" ADD CONSTRAINT "FK_protocol_participants_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocol_participants" ADD CONSTRAINT "FK_protocol_participants_protocol" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "protocol_participants" ADD CONSTRAINT "FK_protocol_participants_membership" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_protocol" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // --- Permission codes (values only; seeded in the next migration) ---
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'PROTOCOL_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'PROTOCOL_WRITE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'PROTOCOL_DELETE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_protocol"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_protocol"`);
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "protocol_id"`,
    );
    await queryRunner.query(`DROP TABLE "protocol_participants"`);
    await queryRunner.query(`DROP TABLE "protocols"`);
    await queryRunner.query(`DROP TYPE "public"."protocols_status_enum"`);
  }
}
