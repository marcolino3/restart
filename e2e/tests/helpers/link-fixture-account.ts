import { Client } from 'pg';
import { randomUUID } from 'node:crypto';

/** Explicit fixture provisioning; production account linking is tested separately. */
export async function linkFixtureAccount(employeeId: string, orgId: string, email: string) {
  if (!['127.0.0.1', 'localhost'].includes(process.env.DB_HOST ?? '') ||
      !['colibri_test', 'restart_employee_e2e'].includes(process.env.DB_NAME ?? '') ||
      !(/^(?:e2e\.(?:second-org|no-admin|restricted|restrictedform)\.[0-9]+@example\.com|e2e-superadmin@example\.com|employee-superadmin@example\.test)$/.test(email))) {
    throw new Error('Account fixture provisioning requires an explicit local E2E database and fixture email');
  }
  const db = new Client({ host:process.env.DB_HOST, port:Number(process.env.DB_PORT), database:process.env.DB_NAME, user:process.env.DB_USERNAME, password:process.env.DB_PASSWORD });
  await db.connect();
  try {
    await db.query('BEGIN');
    const pending = await db.query('SELECT m.id FROM memberships m JOIN employees e ON e.id=m.employee_id WHERE e.id=$1 AND e.organization_id=$2 AND m.organization_id=$2 AND e.profile_email=$3 AND m.user_id IS NULL FOR UPDATE OF m', [employeeId,orgId,email]);
    if (pending.rowCount !== 1) throw new Error('Expected exactly one unlinked fixture membership');
    const addresses = await db.query('SELECT id, user_id FROM user_emails WHERE LOWER(email)=LOWER($1)', [email]);
    if (addresses.rowCount! > 1) throw new Error('Ambiguous fixture identity');
    let userId = addresses.rows[0]?.user_id;
    let addressId = addresses.rows[0]?.id;
    if (!userId) {
      userId = randomUUID(); addressId = randomUUID();
      await db.query('INSERT INTO users (id,version,first_name,last_name) VALUES ($1,1,$2,$3)', [userId,'E2E','Fixture']);
      await db.query('INSERT INTO user_emails (id,version,user_id,email,is_primary,is_verified) VALUES ($1,1,$2,$3,true,true)', [addressId,userId,email]);
    }
    const existing = await db.query('SELECT id, employee_id FROM memberships WHERE organization_id=$1 AND user_id=$2 FOR UPDATE', [orgId, userId]);
    if (existing.rowCount) {
      if (existing.rows[0].employee_id) throw new Error('Fixture account already has an employee');
      // Preserve existing membership and its grants (e.g. bootstrapped superadmin).
      await db.query('INSERT INTO membership_roles (membership_id, role_id) SELECT $1, role_id FROM membership_roles WHERE membership_id=$2 ON CONFLICT DO NOTHING', [existing.rows[0].id, pending.rows[0].id]);
      await db.query('DELETE FROM memberships WHERE id=$1', [pending.rows[0].id]);
      await db.query('UPDATE memberships SET employee_id=$1, user_email_id=$2, "isActive"=true WHERE id=$3', [employeeId,addressId,existing.rows[0].id]);
    } else {
      await db.query('UPDATE memberships SET user_id=$1,user_email_id=$2,"isActive"=true WHERE id=$3', [userId,addressId,pending.rows[0].id]);
    }
    await db.query("UPDATE employees SET account_link_status='CONFIRMED' WHERE id=$1", [employeeId]);
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    await db.end();
  }
}
