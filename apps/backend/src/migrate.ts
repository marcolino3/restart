/**
 * Standalone Migration-Runner für Production / Staging.
 * Wird im K8s Pre-Deploy-Job ausgeführt: `node dist/src/migrate.js`
 *
 * Verhalten:
 *  - Verbindet zur DB anhand der ENV-Variablen
 *  - Führt alle ausstehenden Migrationen aus
 *  - Exit 0 bei Erfolg, Exit 1 bei Fehler
 *  - Schliesst die Connection sauber, damit der Pod terminiert
 */
import { AppDataSource } from './data-source';

async function run(): Promise<void> {
  console.log('[migrate] initializing data source…');
  await AppDataSource.initialize();

  try {
    const pending = await AppDataSource.showMigrations();
    console.log(`[migrate] pending migrations: ${pending ? 'yes' : 'none'}`);

    const ran = await AppDataSource.runMigrations({ transaction: 'each' });
    if (ran.length === 0) {
      console.log('[migrate] no migrations applied (schema is up to date)');
    } else {
      console.log(`[migrate] applied ${ran.length} migration(s):`);
      for (const m of ran) console.log(`  - ${m.name}`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('[migrate] FAILED');
    console.error(err);
    process.exit(1);
  });
