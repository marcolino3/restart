import { test, expect, type Page } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { signInAsSuperAdmin, ensureActiveOrg } from '../helpers/auth';
import { employeeActor, employeeGql, employeeTestDb } from '../helpers/employee-test-fixtures';

const create = async (page: Page, email: string) => {
  const result = await employeeGql(page, 'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id version accountLinkStatus profile { firstName email } membership { id userId isActive } } }', { input: { firstName: 'Independent', lastName: 'Profile', email } });
  expect(result.errors).toBeUndefined();
  return result.data.upsertEmployeeOnboardingDraft;
};
const invite = async (page: Page, employeeId: string, email: string) => {
  const result = await employeeGql(page, 'mutation($id:ID!) { sendEmployeeInvitation(employeeId:$id) { invitationStatus } }', { id: employeeId });
  expect(result.errors).toBeUndefined();
  expect(result.data.sendEmployeeInvitation.invitationStatus).toBe('SENT');
  const directory = resolve(__dirname, '../../.employee-mail');
  const messages = await Promise.all((await readdir(directory)).map(async (name) => JSON.parse(await readFile(resolve(directory, name), 'utf8'))));
  const db = await employeeTestDb();
  let tokenHash: string;
  try { tokenHash = (await db.query('SELECT token_hash FROM employee_account_invitations WHERE employee_id=$1', [employeeId])).rows[0].token_hash; }
  finally { await db.end(); }
  const message = messages.find((item) => item.to === email && createHash('sha256').update(new URL(item.url).searchParams.get('token')!).digest('hex') === tokenHash);
  expect(message).toBeDefined();
  return new URL(message.url).searchParams.get('token')!;
};
const accept = (page: Page, token: string) => page.request.post('http://localhost:4101/api/employee-account/accept', { data: { token } });

test('existing account is disclosed only after explicit signed-in confirmation; replay is rejected', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const orgId = await ensureActiveOrg(page);
  const account = await employeeActor(browser, orgId, ['EMPLOYEE_READ']);
  try {
    const employee = await create(page, account.email);
    expect(employee.membership.userId).toBeNull();
    expect(employee.membership.isActive).toBe(false);
    expect(employee.profile.firstName).toBe('Independent');
    const token = await invite(page, employee.id, account.email);
    expect((await accept(page, token)).status()).toBe(403);
    await account.page.goto(`/en/onboarding/accept-employee?token=${token}`);
    const confirm = account.page.getByRole('button', { name: 'Confirm organization membership' });
    await expect(confirm).toBeEnabled();
    const before = await employeeGql(page, 'query($id:ID!) { employeeById(employeeId:$id) { accountLinkStatus } }', { id: employee.id });
    expect(before.data.employeeById.accountLinkStatus).toBe('UNLINKED');
    await confirm.click();
    await expect(account.page.getByRole('status')).toHaveText('Account linked successfully.');
    expect((await accept(account.page, token)).status()).toBe(400);
    const db = await employeeTestDb();
    try {
      const linked = await db.query('SELECT e.account_link_status, e.profile_first_name, m.id, m.user_id, u.first_name FROM employees e JOIN memberships m ON m.employee_id=e.id JOIN users u ON u.id=m.user_id WHERE e.id=$1', [employee.id]);
      expect(linked.rows).toEqual([{ account_link_status: 'CONFIRMED', profile_first_name: 'Independent', id: account.membershipId, user_id: account.userId, first_name: 'Employee' }]);
      expect((await db.query('SELECT id FROM memberships WHERE id=$1', [employee.membership.id])).rowCount).toBe(0);
    } finally { await db.end(); }
  } finally { await account.context.close(); }
});

test('email correction revokes the old token and expired tokens cannot activate memberships', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const orgId = await ensureActiveOrg(page);
  const account = await employeeActor(browser, orgId, ['EMPLOYEE_READ']);
  try {
    const employee = await create(page, account.email);
    const token = await invite(page, employee.id, account.email);
    const current = await employeeGql(page, 'query($id:ID!) { employeeById(employeeId:$id) { version } }', { id: employee.id });
    const changed = await employeeGql(page, 'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id invitationStatus } }', { input: { id:employee.id, expectedVersion:current.data.employeeById.version, firstName:'Independent',lastName:'Profile',email:`corrected-${randomUUID()}@example.test` } });
    expect(changed.errors).toBeUndefined();
    expect((await accept(account.page, token)).status()).toBe(400);
    const second = await create(page, account.email);
    const nextToken = await invite(page, second.id, account.email);
    const db = await employeeTestDb();
    try { await db.query("UPDATE employee_account_invitations SET expires_at=now()-interval '1 second' WHERE employee_id=$1", [second.id]); }
    finally { await db.end(); }
    expect((await accept(account.page, nextToken)).status()).toBe(400);
    const unchanged = await employeeGql(page, 'query($id:ID!) { employeeById(employeeId:$id) { accountLinkStatus membership { userId isActive } } }', { id:second.id });
    expect(unchanged.data.employeeById).toEqual({ accountLinkStatus:'UNLINKED', membership:{ userId:null,isActive:false } });
  } finally { await account.context.close(); }
});

test('parallel confirmation consumes the token exactly once', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const orgId = await ensureActiveOrg(page);
  const account = await employeeActor(browser, orgId, ['EMPLOYEE_READ']);
  try {
    const employee = await create(page, account.email);
    const token = await invite(page, employee.id, account.email);
    const results = await Promise.all([accept(account.page,token),accept(account.page,token)]);
    expect(results.map((r) => r.status()).sort()).toEqual([201,400]);
  } finally { await account.context.close(); }
});

test('only the account owner can change login email after both mailbox confirmations', async ({ page,browser }) => {
  await signInAsSuperAdmin(page);
  const orgId=await ensureActiveOrg(page);
  const account=await employeeActor(browser,orgId,['EMPLOYEE_READ']);
  const newEmail=`changed-${randomUUID()}@example.test`;
  try {
    const employee=await create(page,account.email);
    expect((await accept(account.page,await invite(page,employee.id,account.email))).status()).toBe(201);
    await account.page.goto('/en/onboarding/change-email');
    await account.page.getByLabel('New email',{exact:true}).fill(newEmail);
    await account.page.getByRole('button',{name:'Request email change'}).click();
    await expect(account.page.getByRole('status')).toHaveText('Confirmation links sent to both mailboxes.');
    const directory=resolve(__dirname,'../../.employee-mail');
    const messages=await Promise.all((await readdir(directory)).map(async(name)=>JSON.parse(await readFile(resolve(directory,name),'utf8'))));
    const oldMessage=messages.find((message)=>message.kind==='account-email' && message.to===account.email);
    const newMessage=messages.find((message)=>message.kind==='account-email' && message.to===newEmail);
    expect(oldMessage).toBeDefined(); expect(newMessage).toBeDefined();
    const oldToken=new URL(oldMessage.url).searchParams.get('token')!;
    const newToken=new URL(newMessage.url).searchParams.get('token')!;
    const intruder=await page.request.post('http://localhost:4101/api/account-email/confirm',{data:{token:newToken}});
    expect(intruder.status()).toBe(400);
    await account.page.goto(`/en/onboarding/change-email?token=${oldToken}`);
    await account.page.getByRole('button',{name:'Confirm this mailbox'}).click();
    await expect(account.page.getByRole('status')).toContainText('Confirm the link in the other mailbox');
    const db=await employeeTestDb();
    try {
      expect((await db.query('SELECT email FROM user_emails WHERE user_id=$1',[account.userId])).rows).toEqual([{email:account.email}]);
    } finally { await db.end(); }
    await account.page.goto(`/en/onboarding/change-email?token=${newToken}`);
    await account.page.getByRole('button',{name:'Confirm this mailbox'}).click();
    await expect(account.page.getByRole('status')).toHaveText('Email changed. All previous sessions have been signed out.');
    const signedOut=await employeeGql(account.page,'{ authContext { user { id } } }');
    expect(signedOut.errors?.length).toBeGreaterThan(0);
    const signin=await account.page.request.post('http://localhost:4101/api/auth/sign-in/email',{headers:{origin:'http://localhost:4100'},data:{email:newEmail,password:'Employee-Test-Password-2026'}});
    expect(signin.status()).toBe(200);
    const replay=await account.page.request.post('http://localhost:4101/api/account-email/confirm',{data:{token:newToken}});
    expect(replay.status()).toBe(400);
    const stored=await employeeGql(page,'query($id:ID!) { employeeById(employeeId:$id) { profile { email firstName } membership { userId userEmail { email } } } }',{id:employee.id});
    expect(stored.errors).toBeUndefined();
    expect(stored.data.employeeById).toEqual({profile:{email:account.email,firstName:'Independent'},membership:{userId:account.userId,userEmail:{email:newEmail}}});
  } finally { await account.context.close(); }
});
