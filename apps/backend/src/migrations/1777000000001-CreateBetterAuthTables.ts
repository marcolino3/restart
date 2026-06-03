import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * better-auth-Tabellen (`user`, `session`, `account`, `verification`).
 *
 * Diese Tabellen liegen NICHT als TypeORM-Entities vor — better-auth verwaltet
 * sie über einen eigenen `pg.Pool` (siehe `src/lib/auth.ts`). Deshalb tauchen
 * sie nicht in der von `migration:generate` erzeugten `InitialSchema` auf und
 * müssen separat angelegt werden, sonst scheitert auf einer frischen DB jeder
 * Login.
 *
 * Quelle: `@better-auth/cli generate` gegen die aktuelle `auth.ts`-Config
 * (better-auth 1.6.x + admin/magicLink/expo/customSession-Plugins). Die
 * Spalten `role/banned/banReason/banExpires` (user) und `impersonatedBy`
 * (session) stammen aus dem admin-Plugin (Impersonation).
 *
 * Bei künftigen better-auth-Plugin-Updates, die das Schema erweitern: NEUE
 * inkrementelle Migration ergänzen, nicht diese hier ändern. `apps/backend/
 * better-auth-schema.sql` als Referenz aktuell halten.
 */
export class CreateBetterAuthTables1777000000001 implements MigrationInterface {
  name = 'CreateBetterAuthTables1777000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text NOT NULL PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "emailVerified" boolean NOT NULL,
        "image" text,
        "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "role" text,
        "banned" boolean,
        "banReason" text,
        "banExpires" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" text NOT NULL PRIMARY KEY,
        "expiresAt" timestamptz NOT NULL,
        "token" text NOT NULL UNIQUE,
        "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamptz NOT NULL,
        "ipAddress" text,
        "userAgent" text,
        "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
        "impersonatedBy" text
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" text NOT NULL PRIMARY KEY,
        "accountId" text NOT NULL,
        "providerId" text NOT NULL,
        "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
        "accessToken" text,
        "refreshToken" text,
        "idToken" text,
        "accessTokenExpiresAt" timestamptz,
        "refreshTokenExpiresAt" timestamptz,
        "scope" text,
        "password" text,
        "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamptz NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" text NOT NULL PRIMARY KEY,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "verification"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "account"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "session"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}
