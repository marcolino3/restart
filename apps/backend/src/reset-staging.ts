/**
 * Destructive reset of the **staging** database, followed by the large
 * Testschule seed.
 *
 * Runs as a K8s Job (nightly CronJob or manual `workflow_dispatch`) so that
 * staging is a reproducible live demo environment rather than a database that
 * slowly fills up with leftovers from manual testing.
 *
 *   node dist/src/reset-staging.js
 *
 * Sequence — the order matters:
 *   1. DROP SCHEMA public CASCADE / CREATE SCHEMA public
 *      (not DROP DATABASE: the job connects to that very database, and the
 *      role does not need CREATEDB)
 *   2. TypeORM migrations — rebuild the schema incl. the system seeds
 *   3. better-auth schema — `user`/`session`/`account` live outside TypeORM
 *   4. Testschule seed — the seed writes better-auth accounts, so it must run
 *      after step 3
 *
 * Every step is a separate child process, mirroring scripts/reset-dev-db.sh:
 * migrate.ts and migrate-auth.ts call process.exit() at module scope and
 * cannot be imported as functions.
 *
 * SAFETY: refuses to run unless NODE_ENV is exactly 'staging' AND the database
 * host resolves into the staging namespace. Production carries
 * NODE_ENV=production and a different host, so this exits before touching
 * anything even if the job were applied to the wrong namespace.
 */
import 'reflect-metadata';
import { spawn } from 'child_process';
import { join } from 'path';
import { Client } from 'pg';

/** Substring every staging database host must contain. */
export const STAGING_HOST_MARKER = 'restart-staging';

/**
 * Reason this environment must not be reset, or `null` when it may be.
 *
 * Separated from the process-exiting caller so the rules can be unit-tested —
 * this is the only thing standing between a misapplied job and a wiped
 * production database.
 */
export function stagingRefusalReason(env: NodeJS.ProcessEnv): string | null {
  if (env.NODE_ENV !== 'staging') {
    return `NODE_ENV is "${env.NODE_ENV ?? '(unset)'}", expected "staging"`;
  }

  const host = env.DB_HOST ?? '';
  if (!host.includes(STAGING_HOST_MARKER)) {
    return `DB_HOST "${host || '(unset)'}" does not contain "${STAGING_HOST_MARKER}"`;
  }

  if (!env.SEED_USER_PASSWORD) {
    return (
      'SEED_USER_PASSWORD is not set — staging is publicly reachable and must ' +
      'not be seeded with the password from the repository'
    );
  }

  return null;
}

function assertStaging(): void {
  const reason = stagingRefusalReason(process.env);
  if (reason !== null) {
    console.error(`[reset-staging] REFUSING TO RUN: ${reason}`);
    process.exit(1);
  }

  console.log(
    `[reset-staging] target: ${process.env.DB_HOST}/${process.env.DB_NAME}`,
  );
}

/** Runs a compiled script in a child process, inheriting stdio. */
function run(
  label: string,
  script: string,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n[reset-staging] ── ${label} ──`);
    const child = spawn(process.execPath, [script], {
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) return resolve();
      reject(
        new Error(
          `${label} failed (${signal ? `signal ${signal}` : `exit code ${code}`})`,
        ),
      );
    });
  });
}

async function dropSchema(): Promise<void> {
  console.log('\n[reset-staging] ── dropping schema public ──');
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    console.log('[reset-staging] schema public recreated (empty)');
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  assertStaging();

  const dist = __dirname;

  await dropSchema();
  await run('TypeORM migrations', join(dist, 'migrate.js'), {});
  await run('better-auth schema', join(dist, 'migrate-auth.js'), {});
  await run(
    'Testschule seed',
    join(dist, '..', 'scripts', 'seed-testschule.js'),
    {
      // The curriculum sheets ship with the image; without this the seed would
      // look in ~/Downloads and skip the curriculum import.
      SEED_CURRICULA_DIR:
        process.env.SEED_CURRICULA_DIR ?? join(dist, '..', '..', 'seed-assets'),
    },
  );

  console.log('\n[reset-staging] ✓ staging reset complete');
}

// Only run when executed directly (`node dist/src/reset-staging.js`), never on
// import — the guard rules above are unit-tested and importing this module
// must not start a destructive reset.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error('\n[reset-staging] FAILED');
      console.error(err);
      process.exit(1);
    });
}
