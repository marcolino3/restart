import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { signInAsSuperAdmin, ensureActiveOrg, setupSecondOrgUser } from '../helpers/auth';
import { employeeActor, employeeGql, employeeTestDb } from '../helpers/employee-test-fixtures';

test('two organizations isolate Employee and all Membership write/read paths', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const first = await ensureActiveOrg(page);
  const createdOrg = await employeeGql(page, 'mutation($input:CreateOrganizationInput!) { createOrganization(input:$input) { id } }', { input:{ name:`E2E employee isolation ${randomUUID()}` } });
  expect(createdOrg.errors).toBeUndefined();
  const second = createdOrg.data.createOrganization.id;
  const owner = await employeeActor(browser,first,['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  const outsider = await employeeActor(browser,second,['EMPLOYEE_READ','EMPLOYEE_WRITE','USER_INVITE']);
  try {
    const created = await employeeGql(owner.page,'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id version membership { id } } }', { input:{ firstName:'Private',lastName:'Organization',email:`isolation-${randomUUID()}@example.test`,privateEmail:'private@example.test' } });
    expect(created.errors).toBeUndefined();
    const employee = created.data.upsertEmployeeOnboardingDraft;
    for (const [query,variables] of [
      ['query($id:ID!) { employeeById(employeeId:$id) { profile { privateEmail } } }',{ id:employee.id }],
      ['query($id:ID!) { membershipsByOrgId(organizationId:$id) { id } }',{ id:first }],
      ['mutation($input:UpdateMembershipInput!) { updateMembership(updateMembershipInput:$input) { id } }',{ input:{ id:employee.membership.id,contactPhone:'stolen' } }],
      ['mutation($id:ID!) { removeEmployeeOnboardingDraft(employeeId:$id) }',{ id:employee.id }],
      ['mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id } }',{ input:{ id:employee.id,expectedVersion:employee.version,firstName:'Stolen',lastName:'Organization' } }],
    ] as const) {
      const result = await employeeGql(outsider.page,query,variables);
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(JSON.stringify(result.data)).not.toContain('private@example.test');
    }
    const unchanged = await employeeGql(owner.page,'query($id:ID!) { employeeById(employeeId:$id) { version profile { firstName privateEmail } membership { contactPhone } } }',{ id:employee.id });
    expect(unchanged.data.employeeById).toEqual({ version:employee.version,profile:{ firstName:'Private',privateEmail:'private@example.test' },membership:{ contactPhone:null } });
    const ownEmails = await employeeGql(owner.page, 'query($id:ID!) { userEmailsByUserId(userId:$id) { id email } }', { id:owner.userId });
    expect(ownEmails.errors).toBeUndefined();
    expect(ownEmails.data.userEmailsByUserId.length).toBeGreaterThan(0);
    for (const [query, variables] of [
      ['query($id:ID!) { userEmailsByUserId(userId:$id) { email } }', { id:owner.userId }],
      ['query($id:ID!) { userEmail(id:$id) { email } }', { id:ownEmails.data.userEmailsByUserId[0].id }],
    ] as const) {
      const denied = await employeeGql(outsider.page, query, variables);
      expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      expect(JSON.stringify(denied.data)).not.toContain(ownEmails.data.userEmailsByUserId[0].email);
    }
    const rebind = await employeeGql(outsider.page,'mutation($input:UpdateMembershipInput!) { updateMembership(updateMembershipInput:$input) { id } }',{ input:{ id:outsider.membershipId,organizationId:first,userId:owner.userId } });
    expect(rebind.errors?.length).toBeGreaterThan(0);
    for (const actor of [owner, outsider]) {
      for (const [query, variables] of [
        ['mutation($input:UpdateUserInput!) { updateUser(updateUserInput:$input) { id } }', { input:{ id:owner.userId,firstName:'Unauthorized global change' } }],
        ['mutation($input:ChangeUserEmailInput!) { changeUserEmail(input:$input) { id } }', { input:{ userId:owner.userId,newEmail:`takeover-${randomUUID()}@example.test` } }],
      ] as const) {
        const denied = await employeeGql(actor.page,query,variables);
        expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      }
    }
  } finally { await owner.context.close(); await outsider.context.close(); }
});

test('school-class reader receives only teacher directory fields; anonymous and read-only writes fail', async ({ page,browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const teacher = await employeeActor(browser,org,['SCHOOL_CLASS_READ']);
  const reader = await employeeActor(browser,org,['EMPLOYEE_READ']);
  const anonymousContext = await browser.newContext();
  const anonymous = await anonymousContext.newPage();
  try {
    const created = await employeeGql(page,'mutation($input:CreateEmployeeInput!) { createEmployee(createEmployeeInput:$input) { id } }',{ input:{ firstName:'Directory',lastName:'Teacher',email:`teacher-${randomUUID()}@example.test`,persona:'TEACHER' } });
    expect(created.errors).toBeUndefined();
    const directory = await employeeGql(teacher.page,'{ teachersByOrgId { id firstName lastName userId } }');
    expect(directory.errors).toBeUndefined();
    expect(directory.data.teachersByOrgId).toContainEqual({ id:created.data.createEmployee.id,firstName:'Directory',lastName:'Teacher',userId:null });
    const leak = await employeeGql(teacher.page,'{ teachersByOrgId { membership { user { privateEmail dateOfBirth } } } }');
    expect(leak.errors?.length).toBeGreaterThan(0);
    const deniedRead = await employeeGql(teacher.page,'{ employeesByOrgId { profile { privateEmail } } }');
    expect(deniedRead.errors?.length).toBeGreaterThan(0);
    for (const actor of [reader.page,anonymous]) {
      const denied = await employeeGql(actor,'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id } }',{ input:{ firstName:'Denied',lastName:'Write',email:`denied-${randomUUID()}@example.test` } });
      expect(denied.errors?.length).toBeGreaterThan(0);
    }
    await reader.page.goto('/en/admin/employees/edit');
    await expect(reader.page).toHaveURL(/forbidden/);
  } finally { await teacher.context.close(); await reader.context.close(); await anonymousContext.close(); }
});

test('real multipart import validates whole-file limits and reports partial rows without SQL details', async ({ page,browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const writer = await employeeActor(browser,org,['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  const prefix = randomUUID();
  const upload = (csv:string) => writer.page.request.post('http://localhost:4101/api/employees/upload',{ multipart:{ file:{ name:'employees.csv',mimeType:'text/csv',buffer:Buffer.from(csv) } } });
  try {
    const validEmail = `${prefix}@example.test`;
    const body = `\uFEFFemail;firstName;lastName;dateOfBirth\r\n${validEmail};"First; quoted";Last;2000-02-29\r\ninvalid;Bad;Email;2000-02-30\r\n${validEmail};Duplicate;Row;2000-01-01`;
    const result = await upload(body);
    expect(result.status()).toBe(201);
    const data = await result.json();
    expect(data.created).toEqual([{ email:validEmail }]);
    expect(data.failed.map((row:{ row:number }) => row.row)).toEqual([3,4]);
    expect(JSON.stringify(data)).not.toMatch(/INSERT|constraint|stack/i);
    expect((await (await upload(body)).json()).created).toEqual([]);
    expect((await upload(`email;firstName;lastName\n${prefix}-blocked@example.test;Good;Row\nbroken`)).status()).toBe(400);
    const tooMany = 'email;firstName;lastName\n'+Array.from({ length:1001 },(_,i) => `${prefix}-${i}@example.test;Row;Limit`).join('\n');
    expect((await upload(tooMany)).status()).toBe(400);
    expect((await upload('x'.repeat(5*1024*1024+1))).status()).toBe(413);
    const rows = await employeeGql(writer.page,'{ employeesByOrgId { profile { email firstName dateOfBirth } } }');
    const imported = rows.data.employeesByOrgId.filter((e:{ profile:{ email:string } }) => e.profile.email?.startsWith(prefix));
    expect(imported).toEqual([{ profile:{ email:validEmail,firstName:'First; quoted',dateOfBirth:'2000-02-29' } }]);
  } finally { await writer.context.close(); }
});

test('employee photo uploads require write access and cannot cross organizations', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const second = await employeeGql(page, 'mutation($input:CreateOrganizationInput!) { createOrganization(input:$input) { id } }', { input: { name: `E2E photo ${randomUUID()}` } });
  const writer = await employeeActor(browser, org, ['EMPLOYEE_READ', 'EMPLOYEE_WRITE']);
  const reader = await employeeActor(browser, org, ['EMPLOYEE_READ']);
  const outsider = await employeeActor(browser, second.data.createOrganization.id, ['EMPLOYEE_WRITE']);
  try {
    const created = await employeeGql(writer.page, 'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id } }', { input: { firstName:'Photo', lastName:'Access', email:`photo-${randomUUID()}@example.test` } });
    expect(created.errors).toBeUndefined();
    const id = created.data.upsertEmployeeOnboardingDraft.id;
    const url = `http://localhost:4101/api/upload?entity=employees&id=${id}`;
    const buffer = await writer.page.screenshot({ type:'png' });
    const upload = (actor: typeof writer, bytes = buffer) => actor.page.request.post(url, { multipart: { file: { name:'avatar.png', mimeType:'image/png', buffer:bytes } } });
    expect((await upload(reader)).status()).toBe(403);
    expect((await upload(outsider)).status()).toBe(403);
    expect((await upload(writer, Buffer.from('invalid image'))).status()).toBe(400);
    expect((await upload(writer, Buffer.alloc(5 * 1024 * 1024 + 1))).status()).toBe(413);
    const saved = await upload(writer);
    expect(saved.status()).toBe(201);
    expect(await saved.json()).toEqual({ url:`/employees/${id}.webp` });
    const path = resolve(process.env.E2E_STORAGE_DIR!, 'uploads', 'employees', `${id}.webp`);
    const photo = await readFile(path);
    expect(photo.toString('ascii', 8, 12)).toBe('WEBP');
    expect((await outsider.page.request.delete(url)).status()).toBe(403);
    expect(await readFile(path)).toEqual(photo);
    expect((await writer.page.request.delete(url)).status()).toBe(200);
    await expect(readFile(path)).rejects.toMatchObject({ code:'ENOENT' });
  } finally {
    await writer.context.close();
    await reader.context.close();
    await outsider.context.close();
  }
});

test('legacy second-organization fixture provisions an explicit account with real login', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  await ensureActiveOrg(page);
  const actor = await setupSecondOrgUser(browser, page);
  try {
    const result = await employeeGql(actor.page, '{ currentUser { userEmails { email } } employeesByOrgId { profile { email } } }');
    expect(result.errors).toBeUndefined();
    expect(result.data.currentUser.userEmails).toContainEqual({ email:actor.email });
    expect(result.data.employeesByOrgId.map((employee: { profile:{ email:string } }) => employee.profile.email)).toContain(actor.email);
  } finally { await actor.page.context().close(); }
});

test('draft deletion requires confirmation and preserves active employees', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, org, ['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  const name = `Delete${randomUUID()}`;
  try {
    const result = await employeeGql(writer.page,'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id membership { id } } }', { input:{ firstName:name,lastName:'Draft',email:`${name}@example.test` } });
    expect(result.errors).toBeUndefined();
    const employee = result.data.upsertEmployeeOnboardingDraft;
    await writer.page.goto('/en/admin/employees');
    await writer.page.getByPlaceholder(/search/i).fill(name);
    const row = writer.page.getByRole('row').filter({ hasText:name });
    await row.getByRole('button', { name:/open menu/i }).click();
    await writer.page.getByRole('menuitem', { name:/delete/i }).click();
    const dialog = writer.page.getByRole('alertdialog');
    await expect(dialog).toContainText(name);
    await dialog.getByRole('button', { name:/cancel/i }).click();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name:/open menu/i }).click();
    await writer.page.getByRole('menuitem', { name:/delete/i }).click();
    await dialog.getByRole('button', { name:/delete/i }).click();
    await expect(dialog).toBeHidden();
    await expect(row).toHaveCount(0);
    const db = await employeeTestDb();
    try {
      expect((await db.query('SELECT id FROM employees WHERE id=$1', [employee.id])).rowCount).toBe(0);
      expect((await db.query('SELECT id FROM memberships WHERE id=$1', [employee.membership.id])).rowCount).toBe(0);
    } finally { await db.end(); }
    const active = await employeeGql(writer.page,'mutation($input:CreateEmployeeInput!) { createEmployee(createEmployeeInput:$input) { id } }', { input:{ firstName:name,lastName:'Active',email:`active-${name}@example.test`,persona:'EMPLOYEE' } });
    expect(active.errors).toBeUndefined();
    const denied = await employeeGql(writer.page,'mutation($id:ID!) { removeEmployeeOnboardingDraft(employeeId:$id) }', { id:active.data.createEmployee.id });
    expect(denied.errors?.length).toBeGreaterThan(0);
    await writer.page.reload();
    await writer.page.getByPlaceholder(/search/i).fill(name);
    await writer.page.getByRole('row').filter({ hasText:name }).getByRole('button', { name:/open menu/i }).click();
    await expect(writer.page.getByRole('menuitem', { name:/delete/i })).toHaveCount(0);
  } finally { await writer.context.close(); }
});
