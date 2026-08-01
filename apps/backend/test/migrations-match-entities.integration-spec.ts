/**
 * Guards the gap between the migrations and the entities.
 *
 * Every other test builds its schema with `synchronize: true`, which derives
 * the tables from the entities — so the two can never disagree there, and a
 * column that the migrations forget to create stays invisible.
 *
 * That gap is not theoretical. A migration once shipped without the
 * AbstractEntity columns on school_class_teachers, and because the entity
 * extends AbstractEntity, every query on that table failed at runtime with
 * "column SchoolClassTeacher.version does not exist" — while the unit suite,
 * the synchronize-based integration suite and CI were all green.
 *
 * This test runs the real migrations against an empty database and then asks
 * TypeORM what it would still have to change. Anything it reports means the
 * migrations and the entities have drifted apart.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=migrations-match-entities
 */
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

// This suite builds its own DataSource instead of going through test-utils,
// which is where every other suite picks up .env.test as an import side
// effect. Without this the connection falls back to the pg defaults and the
// suite can only run in CI, where the DB_* variables come from the job env.
config({ path: join(__dirname, '.env.test') });

const DB_NAME = 'restart_migration_check';

describe('Migrations match the entities', () => {
  let admin: DataSource;
  let migrated: DataSource;

  const baseOptions = {
    type: 'postgres' as const,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  };

  beforeAll(async () => {
    // A throwaway database so the run cannot disturb the other suites.
    admin = new DataSource({
      ...baseOptions,
      database: process.env.DB_NAME,
    });
    await admin.initialize();
    await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);

    migrated = new DataSource({
      ...baseOptions,
      database: DB_NAME,
      entities: [join(__dirname, '..', 'src', '**', '*.entity.{ts,js}')],
      migrations: [join(__dirname, '..', 'src', 'migrations', '*.{ts,js}')],
      synchronize: false,
      migrationsTransactionMode: 'each',
    });
    await migrated.initialize();
    await migrated.runMigrations();
  }, 300_000);

  afterAll(async () => {
    if (migrated?.isInitialized) await migrated.destroy();
    if (admin?.isInitialized) {
      await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
      await admin.destroy();
    }
  });

  it('creates every column the entities declare', async () => {
    const sqlInMemory = await migrated.driver.createSchemaBuilder().log();
    const statements = sqlInMemory.upQueries.map((q) => q.query);

    // Only column-level differences are treated as failures. TypeORM's schema
    // builder also wants to rename constraints and drop database-side
    // defaults it did not create itself; that noise appears for long-standing
    // tables too and says nothing about a missing column.
    const columnDrift = statements.filter((q) =>
      /ADD COLUMN|DROP COLUMN/i.test(q),
    );

    expect(columnDrift).toEqual([]);
  });

  it('has the AbstractEntity columns on school_class_teachers', async () => {
    // The concrete regression, pinned so it cannot come back unnoticed.
    const rows: Array<{ column_name: string }> = await migrated.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'school_class_teachers'`,
    );
    const columns = rows.map((r) => r.column_name);

    for (const expected of [
      'id',
      'version',
      'isActive',
      'isArchived',
      'createdAt',
      'updatedAt',
      'deletedAt',
      'role',
      'workload_percent',
      'valid_from',
      'valid_to',
      'organization_id',
    ]) {
      expect(columns).toContain(expected);
    }
  });

  it('enforces the constraints only the migrations create', async () => {
    // CHECK constraints and partial indexes are invisible to
    // `synchronize: true`, so the service integration suite cannot test them —
    // they exist only in the migrated schema.
    const org: Array<{ id: string }> = await migrated.query(
      `INSERT INTO organizations (id, name, subdomain, "isActive", "isArchived", version, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'Constraint Check', 'concheck', true, false, 1, now(), now())
       RETURNING id`,
    );
    const cls: Array<{ id: string }> = await migrated.query(
      `INSERT INTO school_classes (id, name, organization_id, "sortOrder", "isActive", "isArchived", version, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'Primaria A', $1, 0, true, false, 1, now(), now())
       RETURNING id`,
      [org[0].id],
    );
    const emp: Array<{ id: string }> = await migrated.query(
      `INSERT INTO employees (id, status, invitation_status, time_tracking_enabled, "isActive", "isArchived", version, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'ACTIVE', 'PENDING', false, true, false, 1, now(), now())
       RETURNING id`,
    );

    const assign = (opts: {
      validFrom: string;
      validTo?: string | null;
      workload?: number | null;
    }) =>
      migrated.query(
        `INSERT INTO school_class_teachers
           (id, school_class_id, employee_id, organization_id, role,
            valid_from, valid_to, workload_percent,
            "isActive", "isArchived", version, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'LEAD',
            $4::date, $5::date, $6,
            true, false, 1, now(), now())`,
        [
          cls[0].id,
          emp[0].id,
          org[0].id,
          opts.validFrom,
          opts.validTo ?? null,
          opts.workload ?? null,
        ],
      );

    // Workload outside 0–100 is rejected.
    await expect(
      assign({ validFrom: '2026-01-01', workload: 150 }),
    ).rejects.toThrow(/chk_school_class_teachers_workload/);

    // valid_to before valid_from is rejected.
    await expect(
      assign({ validFrom: '2026-01-01', validTo: '2025-01-01' }),
    ).rejects.toThrow(/chk_school_class_teachers_validity/);

    // One open assignment per person and class; a second one is rejected.
    await assign({ validFrom: '2026-01-01' });
    await expect(assign({ validFrom: '2026-02-01' })).rejects.toThrow(
      /uq_school_class_teachers_open/,
    );

    // ...but once the first is closed, a new assignment may follow — that is
    // what makes the history work.
    await migrated.query(
      `UPDATE school_class_teachers SET valid_to = '2026-01-31' WHERE school_class_id = $1`,
      [cls[0].id],
    );
    await expect(assign({ validFrom: '2026-02-01' })).resolves.toBeDefined();
  });

  it('can round-trip an entity the migrations created', async () => {
    // The schema comparison above comes from metadata; this proves a real
    // INSERT/SELECT works, which is what actually failed in production.
    const org: Array<{ id: string }> = await migrated.query(
      `INSERT INTO organizations (id, name, subdomain, "isActive", "isArchived", version, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'Migration Check', 'migcheck', true, false, 1, now(), now())
       RETURNING id`,
    );
    const schoolClass: Array<{ id: string }> = await migrated.query(
      `INSERT INTO school_classes (id, name, organization_id, "sortOrder", "isActive", "isArchived", version, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'Primaria A', $1, 0, true, false, 1, now(), now())
       RETURNING id`,
      [org[0].id],
    );

    // Selecting the columns the entity declares must not raise.
    const assignments = await migrated.query(
      `SELECT id, version, "isActive", role, workload_percent, valid_from, valid_to
       FROM school_class_teachers WHERE school_class_id = $1`,
      [schoolClass[0].id],
    );
    expect(assignments).toEqual([]);
  });
});
