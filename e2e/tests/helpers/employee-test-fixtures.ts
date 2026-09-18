import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import type { Browser, Page, BrowserContextOptions } from '@playwright/test';

export async function employeeTestDb() {
  if (process.env.DB_NAME !== 'restart_employee_e2e' || process.env.DB_PORT !== '5435' || process.env.DB_HOST !== '127.0.0.1') throw new Error('Employee E2E requires its isolated database');
  const client = new Client({ host: '127.0.0.1', port: 5435, user: 'test', password: 'test', database: 'restart_employee_e2e' });
  await client.connect();
  return client;
}
export async function employeeGql(page: Page, query: string, variables?: Record<string, unknown>) {
  const response = await page.request.post('http://localhost:4101/graphql', { data: { query, variables } });
  return response.json();
}
/** Fixture provisioning only; every request under test uses a real better-auth session. */
export async function employeeActor(browser: Browser, organizationId: string, permissions: string[], options: BrowserContextOptions = {}) {
  const context = await browser.newContext({ ...options, baseURL: 'http://localhost:4100' });
  const page = await context.newPage();
  const email = `employee-${randomUUID()}@example.test`;
  const password = 'Employee-Test-Password-2026';
  const signup = await page.request.post('http://localhost:4101/api/auth/sign-up/email', {
    headers: { origin: 'http://localhost:4100' }, data: { email, password, name: 'Employee Test Actor' },
  });
  if (!signup.ok()) throw new Error('Could not create test auth session');
  const db = await employeeTestDb();
  const userId = randomUUID(), membershipId = randomUUID(), roleId = randomUUID();
  try {
    await db.query('BEGIN');
    await db.query('INSERT INTO users (id, version, first_name, last_name) VALUES ($1,1,$2,$3)', [userId, 'Employee', 'Test Actor']);
    await db.query('INSERT INTO user_emails (version,user_id,email,is_primary,is_verified) VALUES (1,$1,$2,true,true)', [userId,email]);
    await db.query('INSERT INTO memberships (id,version,organization_id,user_id,persona) VALUES ($1,1,$2,$3,$4)', [membershipId,organizationId,userId,'EMPLOYEE']);
    await db.query('INSERT INTO roles (id,version,organization_id,name,is_system) VALUES ($1,1,$2,$3,false)', [roleId,organizationId,`Employee test actor ${roleId}`]);
    await db.query('INSERT INTO role_permissions (role_id,permission_id) SELECT $1,id FROM permissions WHERE code::text = ANY($2::text[])', [roleId,permissions]);
    await db.query('INSERT INTO membership_roles (membership_id,role_id) VALUES ($1,$2)', [membershipId,roleId]);
    await db.query('COMMIT');
  } finally { await db.end(); }
  const switched = await page.request.post('http://localhost:4101/api/org/switch', { data: { orgId: organizationId } });
  if (!switched.ok()) throw new Error('Could not select test organization');
  return { page, context, email, userId, membershipId, roleId };
}
