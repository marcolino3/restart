import { Client } from 'pg';
import { randomUUID } from 'node:crypto';

/** Explicit fixture provisioning; production account linking is tested separately. */
export async function linkFixtureAccount(employeeId: string, orgId: string, email: string) {
  if (!['127.0.0.1', 'localhost'].includes(process.env.DB_HOST ?? '') ||
      !['colibri_test', 'restart_employee_e2e'].includes(process.env.DB_NAME ?? '') ||
      !/^e2e\.second-org\.[0-9]+@example\.com$/.test(email)) {
    throw new Error('Second-org provisioning requires an explicit local E2E database and fixture email');
  }
  const db = new Client({ host:process.env.DB_HOST, port:Number(process.env.DB_PORT), database:process.env.DB_NAME, user:process.env.DB_USERNAME, password:process.env.DB_PASSWORD });
  await db.connect();
  try {
    await db.query('BEGIN');
    const pending = await db.query('SELECT m.id FROM memberships m JOIN employees e ON e.id=m.employee_id WHERE e.id=$1 AND e.organization_id=$2 AND m.organization_id=$2 AND e.profile_email=$3 AND m.user_id IS NULL FOR UPDATE OF m', [employeeId,orgId,email]);
    if (pending.rowCount !== 1) throw new Error('Expected exactly one unlinked fixture membership');
    const userId = randomUUID(), addressId = randomUUID();
    await db.query('INSERT INTO users (id,version,first_name,last_name) VALUES ($1,1,$2,$3)', [userId,'E2E','SecondOrg']);
    await db.query('INSERT INTO user_emails (id,version,user_id,email,is_primary,is_verified) VALUES ($1,1,$2,$3,true,true)', [addressId,userId,email]);
    await db.query('UPDATE memberships SET user_id=$1,user_email_id=$2,"isActive"=true WHERE id=$3', [userId,addressId,pending.rows[0].id]);
    await db.query("UPDATE employees SET account_link_status='CONFIRMED' WHERE id=$1", [employeeId]);
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    await db.end();
  }
}
