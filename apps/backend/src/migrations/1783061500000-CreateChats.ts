import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Chat feature schema: conversations, participants, messages and attachments.
 * Hand-written (not generated) so it contains ONLY the chat tables — a
 * `migration:generate` run against a dev DB pulls in unrelated constraint/enum
 * churn from historical naming drift, which must never land in a migration.
 *
 * The two new permission enum values (CHAT_READ/CHAT_WRITE) are added here via
 * ADD VALUE, but their USE (seeding + role backfill) lives in the separate
 * follow-up migration BackfillChatPermissions — PG16 rejects using an enum
 * value added earlier in the same transaction (55P04), and
 * migrationsTransactionMode is 'each'.
 */
export class CreateChats1783061500000 implements MigrationInterface {
  name = 'CreateChats1783061500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Enums owned by the chat tables -------------------------------------
    await queryRunner.query(
      `CREATE TYPE "public"."conversations_type_enum" AS ENUM('DIRECT', 'GROUP', 'TEAM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_participants_role_enum" AS ENUM('MEMBER', 'ADMIN')`,
    );

    // --- conversations ------------------------------------------------------
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "type" "public"."conversations_type_enum" NOT NULL, "name" text, "team_id" uuid, "last_message_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_conversations" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_conversations_org" ON "conversations" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_conversation_org_team" ON "conversations" ("organization_id", "team_id") WHERE "team_id" IS NOT NULL`,
    );

    // --- conversation_participants ------------------------------------------
    await queryRunner.query(
      `CREATE TABLE "conversation_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "conversation_id" uuid NOT NULL, "membership_id" uuid NOT NULL, "role" "public"."conversation_participants_role_enum" NOT NULL DEFAULT 'MEMBER', "last_read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_conversation_participants" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_participant_membership" ON "conversation_participants" ("membership_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_participant_conversation_membership" ON "conversation_participants" ("conversation_id", "membership_id")`,
    );

    // --- messages -----------------------------------------------------------
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "conversation_id" uuid NOT NULL, "sender_membership_id" uuid, "body" text NOT NULL, "edited_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_messages" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_messages_org" ON "messages" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_messages_conversation_created" ON "messages" ("conversation_id", "createdAt")`,
    );

    // --- message_attachments ------------------------------------------------
    await queryRunner.query(
      `CREATE TABLE "message_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" date, "organization_id" uuid NOT NULL, "message_id" uuid NOT NULL, "file_id" uuid NOT NULL, "original_name" text NOT NULL, "mime_type" text NOT NULL, "size_bytes" integer NOT NULL, CONSTRAINT "PK_message_attachments" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_message_attachments_org" ON "message_attachments" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_message_attachments_message" ON "message_attachments" ("message_id")`,
    );

    // --- foreign keys -------------------------------------------------------
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_participants_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_participants_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_participants_membership" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_sender_membership" FOREIGN KEY ("sender_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_attachments" ADD CONSTRAINT "FK_message_attachments_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_attachments" ADD CONSTRAINT "FK_message_attachments_message" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // --- permission enum values (USED by the follow-up backfill migration) --
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'CHAT_READ'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."permissions_code_enum" ADD VALUE IF NOT EXISTS 'CHAT_WRITE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum values added by ADD VALUE cannot be dropped in Postgres; the enum
    // simply retains CHAT_READ/CHAT_WRITE. Tables and their own enums go.
    await queryRunner.query(`DROP TABLE "message_attachments"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversation_participants"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(
      `DROP TYPE "public"."conversation_participants_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."conversations_type_enum"`);
  }
}
