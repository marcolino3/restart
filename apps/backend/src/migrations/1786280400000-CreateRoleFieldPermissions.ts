import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Field-level RBAC (Phase 2): role -> (resource, field) -> allowed CRUD actions.
 * `resource`/`field` are plain varchar validated against the TS catalog in
 * packages/shared-schemas/src/rbac/field-catalog.ts, not a PG enum — new
 * protected fields must not require a migration (see CLAUDE.md 55P04 rule).
 */
export class CreateRoleFieldPermissions1786280400000 implements MigrationInterface {
  name = 'CreateRoleFieldPermissions1786280400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_field_permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "role_id" uuid NOT NULL,
        "resource" varchar(100) NOT NULL,
        "field" varchar(100) NOT NULL,
        "actions" varchar(20) array NOT NULL DEFAULT '{}',
        CONSTRAINT "pk_role_field_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_role_field_permissions_role" FOREIGN KEY ("role_id")
          REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_role_field_permissions_role_resource_field" ON "role_field_permissions" ("role_id", "resource", "field")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_role_field_permissions_role" ON "role_field_permissions" ("role_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "role_field_permissions"`);
  }
}
