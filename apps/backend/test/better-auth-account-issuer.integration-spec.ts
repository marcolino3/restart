/**
 * Regression test for the staging outage where every login failed with
 * `column account.issuer does not exist`.
 *
 * Two things had gone wrong at once:
 *  1. The deploy job only ran the TypeORM migrations, never `migrate-auth.js`,
 *     so the better-auth tables never followed a better-auth upgrade.
 *  2. better-auth 1.7 makes `account.issuer` NOT NULL, which its own schema
 *     runner refuses to add to a populated table (`UnsafeMigrationError`) —
 *     so the column needs a real expand/backfill/enforce migration.
 *
 * This suite runs the migrations against a throwaway database and checks the
 * migration on both paths it has to survive: an `account` table that does not
 * exist yet (fresh DB — `auth:migrate` creates it afterwards) and one that is
 * already populated (staging/production).
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=better-auth-account-issuer
 */
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

config({ path: join(__dirname, '.env.test') });

const MIGRATION = 'AddBetterAuthAccountIssuer1786800000000';
const DB_NAME = 'restart_auth_issuer_check';

const baseOptions = {
  type: 'postgres' as const,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
};

// The better-auth `account` table as it looked *before* 1.7 — the shape the
// migration finds on staging/production.
const CREATE_LEGACY_ACCOUNT = `
  CREATE TABLE "account" (
    "id" text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "password" text,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  )`;

describe('AddBetterAuthAccountIssuer migration', () => {
  let admin: DataSource;

  const freshDataSource = () =>
    new DataSource({
      ...baseOptions,
      database: DB_NAME,
      migrations: [join(__dirname, '..', 'src', 'migrations', '*.{ts,js}')],
      synchronize: false,
      migrationsTransactionMode: 'each',
    });

  const recreateDatabase = async () => {
    await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}" WITH (FORCE)`);
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
  };

  beforeAll(async () => {
    admin = new DataSource({ ...baseOptions, database: process.env.DB_NAME });
    await admin.initialize();
  }, 60_000);

  afterAll(async () => {
    if (admin?.isInitialized) {
      await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}" WITH (FORCE)`);
      await admin.destroy();
    }
  });

  it('leaves a fresh database with the 1.7 account shape', async () => {
    await recreateDatabase();
    const ds = freshDataSource();
    await ds.initialize();
    try {
      const applied = await ds.runMigrations();
      expect(applied.map((m) => m.name)).toContain(MIGRATION);

      // `CreateBetterAuthTables` creates `account` without `issuer` (the
      // pre-1.7 shape); this migration then brings it up to 1.7. A fresh DB
      // must end up identical to a migrated one, so `auth:migrate` finds
      // nothing left to apply.
      const rows: Array<{ is_nullable: string }> = await ds.query(
        `SELECT is_nullable FROM information_schema.columns
         WHERE table_name = 'account' AND column_name = 'issuer'`,
      );
      expect(rows[0]?.is_nullable).toBe('NO');

      const indexes: Array<{ indexname: string }> = await ds.query(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'account'`,
      );
      expect(indexes.map((i) => i.indexname)).toContain(
        'account_issuer_account_id_uidx',
      );
    } finally {
      await ds.destroy();
    }
  }, 300_000);

  it('survives an `account` table that does not exist yet', async () => {
    // Defensive: the migration is guarded on the table existing, so it also
    // holds if the better-auth tables ever move out of the TypeORM migrations
    // and are created by `auth:migrate` afterwards instead.
    await recreateDatabase();
    const ds = freshDataSource();
    await ds.initialize();
    try {
      await ds.runMigrations();
      await ds.query(`DROP TABLE "account" CASCADE`);
      await ds.query(`DELETE FROM "migrations" WHERE "name" = '${MIGRATION}'`);

      // Must not throw even though `account` is gone.
      const applied = await ds.runMigrations();
      expect(applied.map((m) => m.name)).toContain(MIGRATION);
    } finally {
      await ds.destroy();
    }
  }, 300_000);

  describe('on a populated pre-1.7 `account` table', () => {
    let ds: DataSource;

    beforeAll(async () => {
      await recreateDatabase();

      // Create the legacy table and seed it *before* the migrations run, so
      // the migration sees exactly what staging had.
      const seed = new DataSource({ ...baseOptions, database: DB_NAME });
      await seed.initialize();
      await seed.query(CREATE_LEGACY_ACCOUNT);
      await seed.query(
        `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password")
         VALUES ('acc-1', 'user-1', 'credential', 'user-1', 'hash'),
                ('acc-2', '108431234567890', 'google', 'user-1', NULL),
                ('acc-3', '000123.abc', 'apple', 'user-2', NULL)`,
      );
      await seed.destroy();

      ds = freshDataSource();
      await ds.initialize();
      await ds.runMigrations();
    }, 300_000);

    afterAll(async () => {
      if (ds?.isInitialized) await ds.destroy();
    });

    it('backfills the issuer values better-auth writes at runtime', async () => {
      const rows: Array<{ id: string; issuer: string }> = await ds.query(
        `SELECT "id", "issuer" FROM "account" ORDER BY "id"`,
      );

      // Mirrors createLocalAccountIssuer('credential') and
      // createOAuthAccountIssuer(providerId) from @better-auth/core.
      expect(rows).toEqual([
        { id: 'acc-1', issuer: 'local:credential' },
        { id: 'acc-2', issuer: 'local:oauth:google' },
        { id: 'acc-3', issuer: 'local:oauth:apple' },
      ]);
    });

    it('makes `issuer` NOT NULL so better-auth 1.7 can query the table', async () => {
      const rows: Array<{ is_nullable: string }> = await ds.query(
        `SELECT is_nullable FROM information_schema.columns
         WHERE table_name = 'account' AND column_name = 'issuer'`,
      );
      expect(rows[0]?.is_nullable).toBe('NO');
    });

    it('enforces one account per (issuer, accountId)', async () => {
      await expect(
        ds.query(
          `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "issuer")
           VALUES ('acc-dup', '108431234567890', 'google', 'user-9', 'local:oauth:google')`,
        ),
      ).rejects.toThrow(/duplicate key|unique/i);
    });

    it('keeps the same account id usable across different issuers', async () => {
      // The unique index is on the pair, not on accountId alone — the same
      // subject id at two different issuers must still be insertable.
      await ds.query(
        `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "issuer")
         VALUES ('acc-4', '108431234567890', 'apple', 'user-3', 'local:oauth:apple')`,
      );
      const rows: Array<{ count: string }> = await ds.query(
        `SELECT count(*) AS count FROM "account" WHERE "accountId" = '108431234567890'`,
      );
      expect(rows[0].count).toBe('2');
    });
  });
});
