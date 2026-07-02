/**
 * Standalone Migration-Runner für das **better-auth**-Schema.
 *
 * Hintergrund: better-auth verwaltet seine eigenen Tabellen (`user`, `session`,
 * `account`, `verification`, …) ausserhalb von TypeORM. Weder `synchronize` noch
 * die TypeORM-Migrationen (`src/migrations/`) erzeugen sie — die TypeORM-`User`-
 * Entity mappt auf `users` (Plural) und ist eine andere Tabelle.
 *
 * Auf einer frischen DB fehlen die better-auth-Tabellen daher komplett, was zu
 * `relation "session"/"user" does not exist` führt, sobald die Sign-in-Seite
 * better-auth aufruft.
 *
 * Dieses Script wendet das von der better-auth-Konfiguration (`src/lib/auth.ts`)
 * abgeleitete Schema idempotent an:
 *  - E2E-CI: vor dem Playwright-Lauf gegen die Test-DB.
 *  - Staging/Prod: als Bootstrap-Schritt neben dem TypeORM-Migration-Job.
 *
 * Verbindet via der DB_* ENV-Variablen (better-auth nutzt denselben `pg.Pool`).
 */
import { auth } from './lib/auth';

async function run(): Promise<void> {
  console.log('[migrate-auth] resolving better-auth migrations…');

  // `better-auth/db/migration` ist ein ESM-only Subpath; aus dem CommonJS-Output
  // per dynamischem Import laden.
  const { getMigrations } = await import('better-auth/db/migration');

  const { toBeAdded, toBeCreated, runMigrations } = await getMigrations(
    auth.options,
  );

  const pendingTables = toBeCreated.map((t) => t.table);
  const pendingColumns = toBeAdded.map((t) => t.table);

  if (pendingTables.length === 0 && pendingColumns.length === 0) {
    console.log('[migrate-auth] schema is up to date (nothing to apply)');
    return;
  }

  if (pendingTables.length > 0) {
    console.log(`[migrate-auth] creating tables: ${pendingTables.join(', ')}`);
  }
  if (pendingColumns.length > 0) {
    console.log(
      `[migrate-auth] adding columns on: ${pendingColumns.join(', ')}`,
    );
  }

  await runMigrations();
  console.log('[migrate-auth] applied better-auth schema successfully');
}

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('[migrate-auth] FAILED');
    console.error(err);
    process.exit(1);
  });
