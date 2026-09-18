import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth';
import { employeeActor, employeeGql } from '../helpers/employee-test-fixtures';

test('invalid private email leaves the new draft editable without persisting it', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, org, ['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  const email = `invalid-${randomUUID()}@example.test`;
  try {
    await writer.page.goto('/en/admin/employees/edit');
    await writer.page.getByLabel(/first name/i).fill('Validation');
    await writer.page.getByLabel(/last name/i).fill('Retry');
    await writer.page.getByLabel(/e-?mail/i).first().fill(email);
    await writer.page.getByLabel(/private.*e-?mail/i).fill('invalid');
    const save = writer.page.getByRole('button', { name:/save.*draft|draft.*close/i });
    await save.click();
    await expect(writer.page.getByLabel(/private.*e-?mail/i)).toHaveAttribute('aria-invalid','true');
    await expect(save).toBeEnabled();
    await expect(writer.page).toHaveURL(/employees\/edit$/);
    const rows = await employeeGql(writer.page,'{ employeesByOrgId { profile { email } } }');
    expect(rows.data.employeesByOrgId.some((row: { profile:{ email:string } }) => row.profile.email === email)).toBe(false);
    await writer.page.getByLabel(/private.*e-?mail/i).fill('valid@example.test');
    await save.click();
    await expect(writer.page).toHaveURL(/employees$/);
  } finally { await writer.context.close(); }
});

test('injected save transport failure keeps values and allows a successful retry', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, org, ['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  const email = `retry-${randomUUID()}@example.test`;
  let blocked = 0;
  try {
    await writer.page.goto('/en/admin/employees/edit');
    await writer.page.getByLabel(/first name/i).fill('Network');
    await writer.page.getByLabel(/last name/i).fill('Retry');
    await writer.page.getByLabel(/e-?mail/i).first().fill(email);
    await writer.page.route('**/en/admin/employees/edit', async (route) => {
      if (route.request().headers()['next-action']) {
        blocked += 1;
        await route.abort('failed');
      } else await route.continue();
    });
    const save = writer.page.getByRole('button', { name:/save.*draft|draft.*close/i });
    await save.click();
    await expect(writer.page.getByText('Could not save the draft', { exact:true })).toBeVisible();
    await expect(save).toBeEnabled();
    expect(blocked).toBe(1);
    await expect(writer.page.getByLabel(/first name/i)).toHaveValue('Network');
    await writer.page.unroute('**/en/admin/employees/edit');
    await save.click();
    await expect(writer.page).toHaveURL(/employees$/);
    const rows = await employeeGql(writer.page,'{ employeesByOrgId { profile { email firstName lastName } } }');
    expect(rows.data.employeesByOrgId.filter((row: { profile:{ email:string } }) => row.profile.email === email)).toEqual([{ profile:{ email,firstName:'Network',lastName:'Retry' } }]);
  } finally { await writer.context.close(); }
});

test('editing basis information without role permission preserves multiple assigned roles', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, org, ['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  try {
    const role = await employeeGql(page,'mutation($input:CreateRoleInput!) { createRole(input:$input) { id } }', { input:{ name:`Additional ${randomUUID()}`,permissionCodes:[] } });
    expect(role.errors).toBeUndefined();
    const roleIds = [writer.roleId,role.data.createRole.id].sort();
    const created = await employeeGql(page,'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id } }', { input:{ firstName:'Multiple',lastName:'Roles',email:`roles-${randomUUID()}@example.test`,roleIds } });
    expect(created.errors).toBeUndefined();
    const id = created.data.upsertEmployeeOnboardingDraft.id;
    await writer.page.goto(`/en/admin/employees/edit/${id}`);
    await writer.page.getByLabel(/first name/i).fill('Updated');
    await writer.page.getByRole('button', { name:/save.*draft|draft.*close/i }).click();
    await expect(writer.page).toHaveURL(/employees$/);
    const after = await employeeGql(writer.page,'query($id:ID!) { employeeById(employeeId:$id) { profile { firstName } membership { roles { id } } } }', { id });
    expect(after.data.employeeById.profile.firstName).toBe('Updated');
    expect(after.data.employeeById.membership.roles.map((entry:{ id:string }) => entry.id).sort()).toEqual(roleIds);
    await writer.page.goto(`/en/admin/employees/edit/${id}`);
    await expect(writer.page.getByLabel(/first name/i)).toHaveValue('Updated');
  } finally { await writer.context.close(); }
});

test('stale browser edits cannot overwrite a newer persisted employee version', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, org, ['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  const stale = await writer.context.newPage();
  try {
    const created = await employeeGql(writer.page,'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id } }', { input:{ firstName:'Original',lastName:'Conflict',email:`conflict-${randomUUID()}@example.test` } });
    expect(created.errors).toBeUndefined();
    const id = created.data.upsertEmployeeOnboardingDraft.id;
    for (const tab of [writer.page,stale]) {
      await tab.goto(`/en/admin/employees/edit/${id}`);
      await expect(tab.getByLabel(/first name/i)).toHaveValue('Original');
    }
    await writer.page.getByLabel(/first name/i).fill('Newest');
    await writer.page.getByRole('button', { name:/save.*draft|draft.*close/i }).click();
    await expect(writer.page).toHaveURL(/employees$/);
    await stale.getByLabel(/first name/i).fill('Obsolete');
    const save = stale.getByRole('button', { name:/save.*draft|draft.*close/i });
    await save.click();
    await expect(stale.getByText('Could not save the draft', { exact:true }).first()).toBeVisible();
    await expect(save).toBeEnabled();
    const persisted = await employeeGql(writer.page,'query($id:ID!) { employeeById(employeeId:$id) { status profile { firstName } } }', { id });
    expect(persisted.data.employeeById).toEqual({ status:'DRAFT',profile:{ firstName:'Newest' } });
  } finally { await writer.context.close(); }
});

test('injected slow save persists edits made while the first request is pending', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, org, ['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  const email = `slow-${randomUUID()}@example.test`;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let requests = 0;
  try {
    await writer.page.goto('/en/admin/employees/edit');
    await writer.page.getByLabel(/first name/i).fill('Before');
    await writer.page.getByLabel(/last name/i).fill('Pending');
    await writer.page.getByLabel(/e-?mail/i).first().fill(email);
    await writer.page.route('**/en/admin/employees/edit', async (route) => {
      if (route.request().headers()['next-action'] && ++requests === 1) await gate;
      await route.continue();
    });
    const save = writer.page.getByRole('button', { name:/save.*draft|draft.*close/i });
    await save.click();
    await expect.poll(() => requests).toBe(1);
    await expect(save).toBeDisabled();
    await writer.page.getByLabel(/first name/i).fill('Latest');
    release();
    await expect(writer.page).toHaveURL(/employees$/);
    expect(requests).toBe(2);
    const rows = await employeeGql(writer.page,'{ employeesByOrgId { profile { email firstName } } }');
    expect(rows.data.employeesByOrgId.filter((row: { profile:{ email:string } }) => row.profile.email === email)).toEqual([{ profile:{ email,firstName:'Latest' } }]);
  } finally { release(); await writer.context.close(); }
});

test('injected final save failure never finalizes or sends an invitation', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const org = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, org, ['EMPLOYEE_READ','EMPLOYEE_WRITE','ROLE_ASSIGN']);
  try {
    const created = await employeeGql(page,'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id } }', { input:{ firstName:'Final',lastName:'Failure',email:`final-${randomUUID()}@example.test`,roleIds:[writer.roleId],contract:{ startDate:'2026-10-01',contractType:'PERMANENT' } } });
    expect(created.errors).toBeUndefined();
    const id = created.data.upsertEmployeeOnboardingDraft.id;
    await writer.page.goto(`/en/admin/employees/edit/${id}`);
    await expect(writer.page.getByLabel(/first name/i)).toHaveValue('Final');
    await writer.page.getByRole('button', { name:/^next$/i }).click();
    await expect(writer.page.getByRole('button', { name:/entry date|Oct.*2026|1.*Oct/i }).first()).toBeVisible();
    await writer.page.getByRole('button', { name:/^next$/i }).click();
    await writer.page.getByRole('radio', { name:'Send immediately after creating', exact:true }).click();
    const finalize = writer.page.getByRole('button', { name:/create & send invitation/i });
    await expect(finalize).toBeVisible();
    let intercepted = 0;
    await writer.page.route(`**/en/admin/employees/edit/${id}`, async (route) => {
      if (route.request().headers()['next-action']) { intercepted += 1; await route.abort('failed'); }
      else await route.continue();
    });
    await finalize.click();
    await expect(writer.page.getByText('Could not save the draft', { exact:true })).toBeVisible();
    await expect(finalize).toBeEnabled();
    expect(intercepted).toBe(1);
    const persisted = await employeeGql(writer.page,'query($id:ID!) { employeeById(employeeId:$id) { status invitationStatus } }', { id });
    expect(persisted.data.employeeById).toEqual({ status:'DRAFT',invitationStatus:'PENDING' });
  } finally { await writer.context.close(); }
});
