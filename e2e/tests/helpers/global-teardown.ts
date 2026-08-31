import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'
import { E2E_NAME_PREFIX, E2E_ORG_PREFIX } from './fixture-naming'

/**
 * Deletes everything the E2E fixtures created, so a test run leaves the
 * database exactly as it found it.
 *
 * Why direct SQL instead of the API: `removeOrganization` is a soft delete
 * (isActive=false / isArchived=true) — it archives the org but leaves every
 * row in place, which is right for production but useless as a teardown. And
 * the fixture data spans ~80 tables that reference `organizations`, most of
 * them with ON DELETE NO ACTION (plus `roles` with RESTRICT), so a plain
 * DELETE on `organizations` would fail on the first foreign key.
 *
 * Scope guard: only organizations whose name starts with the E2E fixture
 * prefix are touched. Seed data (e.g. "Testschule") and anything a developer
 * created by hand is never matched. If the prefix matches nothing, the
 * teardown is a no-op.
 *
 * Also removes the better-auth accounts + users the fixtures signed up
 * (`e2e.*@example.com`), which live outside the organization foreign-key
 * graph and would otherwise survive.
 *
 * Specs mostly create their data inside the seeded local organization rather
 * than a fixture org (absence categories, school classes, teams, holidays,
 * company vacations, …). Those rows are found by the `E2E` name prefix
 * (fixture-naming.ts) in every table that has a `name`/`title`/`note`/`label`
 * column, including the `*_translations` tables whose parent carries no name
 * of its own.
 */
const FIXTURE_EMAIL_PATTERN = 'e2e.%@example.com'
// Absences the specs create carry an "E2E …" note. They usually live in the
// seeded local organization (not a fixture org), and the app only soft-deletes
// them (isActive=false), so they would pile up run after run. Matched anywhere
// in the note, because `reportSickLeave` prefixes the comment with the date.
const FIXTURE_ABSENCE_NOTE_PATTERN = '%E2E%'
// Columns the generic prefix sweep looks at.
const NAME_COLUMNS = ['name', 'title', 'note', 'label', 'firstName', 'first_name']
// Tables the generic sweep must never touch: system/seed tables, and the ones
// with their own, narrower cleanup (organizations, users).
const SWEEP_EXCLUDED_TABLES = new Set([
  'organizations',
  'typeorm_migrations',
  'permissions',
  'country',
  'user',
  'users',
  'session',
  'account',
  'verification',
  'pubsub_payloads',
])

/**
 * Reads the DB_* connection settings from the backend's .env when they are
 * not already in the environment. CI exports them to the Playwright step and
 * therefore always wins; locally the values live only in
 * apps/backend/.env — and the local port is NOT the Postgres default, so
 * falling back to 5432 could point the cleanup at an unrelated database.
 */
function loadBackendEnv(): Record<string, string> {
  const envPath = join(__dirname, '..', '..', '..', 'apps', 'backend', '.env')
  try {
    return Object.fromEntries(
      readFileSync(envPath, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const eq = line.indexOf('=')
          const key = line.slice(0, eq).trim()
          const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
          return [key, value]
        }),
    )
  } catch {
    return {}
  }
}

function dbConfig() {
  const fileEnv = loadBackendEnv()
  const read = (key: string) => process.env[key] ?? fileEnv[key]

  const host = read('DB_HOST')
  const port = read('DB_PORT')
  const user = read('DB_USERNAME')
  const database = read('DB_NAME')
  if (!host || !port || !user || !database) return undefined

  return {
    host,
    port: Number(port),
    user,
    password: read('DB_PASSWORD') ?? '',
    database,
  }
}

/**
 * Deletes every row that references `parentTable` via a foreign key pointing
 * at one of `ids`, whatever the constraint's delete rule is. Postgres only
 * cascades where a constraint says so, and most of this schema's foreign keys
 * are NO ACTION or RESTRICT, so the dependents have to be removed explicitly.
 *
 * Recurses into the dependents first (a curriculum owns levels, which own
 * nodes, which lesson records point at), including self-references such as
 * `curriculum_nodes.parent_id`, so an arbitrarily deep chain is removed from
 * the leaves upwards. Tables without a uuid `id` (pure join tables) are
 * deleted directly — nothing can reference them.
 */
async function deleteDependents(
  client: Client,
  parentTable: string,
  ids: string[],
  depth = 0,
): Promise<number> {
  if (ids.length === 0 || depth > 12) return 0

  const fks = await client.query<{
    table_name: string
    column_name: string
    has_uuid_id: boolean
  }>(
    `SELECT DISTINCT tc.table_name, kcu.column_name,
            EXISTS (
              SELECT 1 FROM information_schema.columns c
               WHERE c.table_schema = 'public'
                 AND c.table_name = tc.table_name
                 AND c.column_name = 'id'
                 AND c.data_type = 'uuid'
            ) AS has_uuid_id
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON kcu.constraint_name = tc.constraint_name
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name = $1`,
    [parentTable],
  )

  let deleted = 0
  for (const { table_name, column_name, has_uuid_id } of fks.rows) {
    if (has_uuid_id) {
      const children = await client.query<{ id: string }>(
        `SELECT id FROM "${table_name}"
          WHERE "${column_name}" = ANY($1::uuid[])
            AND NOT (id = ANY($1::uuid[]))`,
        [ids],
      )
      const childIds = children.rows.map((r) => r.id)
      if (childIds.length === 0) continue
      deleted += await deleteDependents(client, table_name, childIds, depth + 1)
    }
    const res = await client.query(
      `DELETE FROM "${table_name}" WHERE "${column_name}" = ANY($1::uuid[])`,
      [ids],
    )
    deleted += res.rowCount ?? 0
  }
  return deleted
}

/**
 * Deletes every row whose `name`/`title`/`note`/`label` starts with the E2E
 * prefix, in whatever table that column lives. Rows in `*_translations`
 * tables are resolved to their parent (the entity that actually owns the
 * name) and the parent is deleted, which cascades to all translations.
 * Dependents are removed through `deleteDependents`, so a spec-created
 * category with absences attached, or a class with enrollments, goes as one.
 */
async function sweepByNamePrefix(
  client: Client,
): Promise<{ rows: number; tables: string[] }> {
  const columns = await client.query<{ table_name: string; column_name: string }>(
    `SELECT c.table_name, c.column_name
       FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.column_name = ANY($1::text[])
        AND c.data_type IN ('character varying', 'text')
        AND EXISTS (
          SELECT 1 FROM information_schema.columns i
           WHERE i.table_schema = 'public'
             AND i.table_name = c.table_name
             AND i.column_name = 'id'
             AND i.data_type = 'uuid'
        )
      ORDER BY c.table_name, c.column_name`,
    [NAME_COLUMNS],
  )

  const pattern = `${E2E_NAME_PREFIX}%`
  // table -> ids to delete, aggregated across name columns and translations
  const victims = new Map<string, Set<string>>()
  const add = (table: string, ids: string[]) => {
    if (ids.length === 0) return
    const set = victims.get(table) ?? new Set<string>()
    for (const id of ids) set.add(id)
    victims.set(table, set)
  }

  for (const { table_name, column_name } of columns.rows) {
    if (SWEEP_EXCLUDED_TABLES.has(table_name)) continue

    if (table_name.endsWith('_translations')) {
      // Resolve to the parent through the translation table's foreign key.
      const fk = await client.query<{ column_name: string; parent: string }>(
        `SELECT kcu.column_name, ccu.table_name AS parent
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu
             ON kcu.constraint_name = tc.constraint_name
           JOIN information_schema.constraint_column_usage ccu
             ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1
            AND ccu.table_name NOT IN ('organizations')
          LIMIT 1`,
        [table_name],
      )
      const link = fk.rows[0]
      if (!link || SWEEP_EXCLUDED_TABLES.has(link.parent)) continue
      const parents = await client.query<{ id: string }>(
        `SELECT DISTINCT "${link.column_name}" AS id FROM "${table_name}"
          WHERE "${column_name}" LIKE $1`,
        [pattern],
      )
      add(
        link.parent,
        parents.rows.map((r) => r.id),
      )
      continue
    }

    const rows = await client.query<{ id: string }>(
      `SELECT id FROM "${table_name}" WHERE "${column_name}" LIKE $1`,
      [pattern],
    )
    add(
      table_name,
      rows.rows.map((r) => r.id),
    )
  }

  let rows = 0
  const tables: string[] = []
  for (const [table, idSet] of victims) {
    const ids = [...idSet]
    await deleteDependents(client, table, ids)
    const res = await client.query(
      `DELETE FROM "${table}" WHERE id = ANY($1::uuid[])`,
      [ids],
    )
    if ((res.rowCount ?? 0) > 0) {
      rows += res.rowCount ?? 0
      tables.push(`${table}(${res.rowCount})`)
    }
  }
  return { rows, tables }
}

export default async function globalTeardown(): Promise<void> {
  if (process.env.E2E_SKIP_TEARDOWN === 'true') {
    // eslint-disable-next-line no-console
    console.log('[global-teardown] skipped (E2E_SKIP_TEARDOWN=true)')
    return
  }

  const config = dbConfig()
  if (!config) {
    // eslint-disable-next-line no-console
    console.warn(
      '[global-teardown] no DB_HOST/DB_PORT/DB_USERNAME/DB_NAME resolved — fixture data was NOT cleaned up',
    )
    return
  }

  const client = new Client(config)
  try {
    await client.connect()
  } catch (err) {
    // A teardown must never turn a green run red. Report loudly instead.
    // eslint-disable-next-line no-console
    console.warn(
      `[global-teardown] could not connect to the database — fixture data was NOT cleaned up: ${String(err)}`,
    )
    return
  }

  try {
    await client.query('BEGIN')

    const victims = await client.query<{ id: string }>(
      'SELECT id FROM organizations WHERE name LIKE $1',
      [`${E2E_ORG_PREFIX}%`],
    )
    const orgIds = victims.rows.map((r) => r.id)

    if (orgIds.length > 0) {
      const deletedRows = await deleteDependents(client, 'organizations', orgIds)
      await client.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', [
        orgIds,
      ])
      // eslint-disable-next-line no-console
      console.log(
        `[global-teardown] removed ${orgIds.length} fixture organization(s) and ${deletedRows} dependent row(s)`,
      )
    }

    // Everything the specs named with the E2E prefix, in whatever table.
    const swept = await sweepByNamePrefix(client)
    if (swept.rows > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[global-teardown] swept ${swept.rows} E2E row(s) across ${swept.tables.length} table(s): ${swept.tables.join(', ')}`,
      )
    }

    // Absences created by the specs, wherever they live. Hard delete, because
    // the app itself only flags them inactive.
    const absenceIds = await client.query<{ id: string }>(
      `SELECT id FROM employee_absences WHERE note LIKE $1`,
      [FIXTURE_ABSENCE_NOTE_PATTERN],
    )
    if (absenceIds.rows.length > 0) {
      const ids = absenceIds.rows.map((r) => r.id)
      await client.query(
        'DELETE FROM employee_absence_days WHERE employee_absence_id = ANY($1::uuid[])',
        [ids],
      )
      await client.query(
        'DELETE FROM employee_absences WHERE id = ANY($1::uuid[])',
        [ids],
      )
      // eslint-disable-next-line no-console
      console.log(
        `[global-teardown] removed ${ids.length} E2E absence(s) and their days`,
      )
    }

    // Families created by the student import: the app derives their name from
    // the family surname ("Familie <Nachname>"), so it never starts with the
    // E2E prefix and the generic sweep above cannot see them. Only families
    // without contact persons are removed, so a family the sweep kept members
    // for is never deleted out from under them.
    const orphanFamilies = await client.query<{ id: string }>(
      `SELECT f.id FROM families f
        WHERE f.name LIKE $1
          AND NOT EXISTS (
            SELECT 1 FROM contact_persons c WHERE c.family_id = f.id
          )`,
      [`%${E2E_NAME_PREFIX}%`],
    )
    if (orphanFamilies.rows.length > 0) {
      const ids = orphanFamilies.rows.map((r) => r.id)
      await client.query('DELETE FROM families WHERE id = ANY($1::uuid[])', [
        ids,
      ])
      // eslint-disable-next-line no-console
      console.log(`[global-teardown] removed ${ids.length} E2E family/families`)
    }

    // Memberships the fixtures created inside an org that is NOT itself a
    // fixture org — ensureTeacher/ensureEmployee add their employees to
    // whatever org the run was using, which locally is the seeded school.
    // These are not covered by the organization sweep above but block the
    // user deletes below (memberships.user_id is ON DELETE RESTRICT).
    const fixtureMemberships = await client.query<{ id: string }>(
      `SELECT m.id FROM memberships m
        WHERE m.user_id IN (
          SELECT ue.user_id FROM user_emails ue WHERE ue.email LIKE $1
        )`,
      [FIXTURE_EMAIL_PATTERN],
    )
    const membershipIds = fixtureMemberships.rows.map((r) => r.id)
    if (membershipIds.length > 0) {
      // Rows that reference a membership with ON DELETE NO ACTION/RESTRICT
      // (employee_absences, projects, tasks, protocols, …) must go first.
      await deleteDependents(client, 'memberships', membershipIds)
    }
    const memberships = await client.query(
      'DELETE FROM memberships WHERE id = ANY($1::uuid[])',
      [membershipIds],
    )
    if ((memberships.rowCount ?? 0) > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[global-teardown] removed ${memberships.rowCount} fixture membership(s) from non-fixture organizations`,
      )
    }

    // `employees` is a bare satellite of `memberships` (one-to-one, owned by
    // the membership, no org/user of its own). Deleting a fixture membership
    // — here or via the org sweep — leaves its employee row behind, unreachable
    // by the app. Such orphans are never legitimate, so remove them all.
    const orphanEmployees = await client.query<{ id: string }>(
      `SELECT e.id FROM employees e
        WHERE NOT EXISTS (SELECT 1 FROM memberships m WHERE m.employee_id = e.id)`,
    )
    if (orphanEmployees.rows.length > 0) {
      const ids = orphanEmployees.rows.map((r) => r.id)
      await deleteDependents(client, 'employees', ids)
      await client.query('DELETE FROM employees WHERE id = ANY($1::uuid[])', [ids])
      // eslint-disable-next-line no-console
      console.log(
        `[global-teardown] removed ${ids.length} orphaned employee row(s) without membership`,
      )
    }

    // better-auth identities created by the fixtures (sign-up in
    // setupSecondOrgUser). `account` references `user`, so delete it first.
    const accounts = await client.query(
      `DELETE FROM "account"
        WHERE "userId" IN (SELECT id FROM "user" WHERE email LIKE $1)`,
      [FIXTURE_EMAIL_PATTERN],
    )
    const sessions = await client.query(
      `DELETE FROM "session"
        WHERE "userId" IN (SELECT id FROM "user" WHERE email LIKE $1)`,
      [FIXTURE_EMAIL_PATTERN],
    )
    const users = await client.query(`DELETE FROM "user" WHERE email LIKE $1`, [
      FIXTURE_EMAIL_PATTERN,
    ])
    if ((users.rowCount ?? 0) > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[global-teardown] removed ${users.rowCount} fixture auth user(s), ${accounts.rowCount} account(s), ${sessions.rowCount} session(s)`,
      )
    }

    // The TypeORM-side identity (`users`, e-mail in the CASCADE-ing
    // `user_emails`). Deleted after the organizations because `memberships`
    // references it with ON DELETE RESTRICT — while a fixture membership
    // still exists, this delete would fail.
    const domainUsers = await client.query(
      `DELETE FROM users u
        WHERE EXISTS (
          SELECT 1 FROM user_emails ue
           WHERE ue.user_id = u.id AND ue.email LIKE $1
        )`,
      [FIXTURE_EMAIL_PATTERN],
    )
    if ((domainUsers.rowCount ?? 0) > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[global-teardown] removed ${domainUsers.rowCount} fixture domain user(s)`,
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined)
    // eslint-disable-next-line no-console
    console.warn(`[global-teardown] cleanup failed, rolled back: ${String(err)}`)
  } finally {
    await client.end()
  }
}
