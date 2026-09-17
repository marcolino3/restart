import { test, expect } from '@playwright/test';
import { signInAsSuperAdmin, ensureActiveOrg } from '../helpers/auth';
import { employeeActor, employeeGql } from '../helpers/employee-test-fixtures';

test('writer saves and clears basis fields through the UI without role permission', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const orgId = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, orgId, ['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  try {
    await writer.page.goto('/en/admin/employees/edit');
    await writer.page.getByLabel(/first name/i).fill('Employee Basics');
    await writer.page.getByLabel(/last name/i).fill('Roundtrip');
    const email = `basis-${Date.now()}@example.test`;
    await writer.page.getByLabel(/e-?mail/i).first().fill(email);
    await writer.page.getByLabel(/private.*e-?mail/i).fill('private@example.test');
    await writer.page.getByRole('button', { name: /save.*draft|draft.*close/i }).click();
    await expect(writer.page).toHaveURL(/\/admin\/employees$/);
    const list = await employeeGql(writer.page, '{ employeesByOrgId { id version profile { firstName email privateEmail } membership { roles { id } userId } } }');
    expect(list.errors).toBeUndefined();
    const employee = list.data.employeesByOrgId.find((item: { profile: { email: string } }) => item.profile.email === email);
    expect(employee.profile.privateEmail).toBe('private@example.test');
    expect(employee.membership.userId).toBeNull();
    expect(employee.membership.roles).toEqual([]);
    await writer.page.goto(`/en/admin/employees/edit/${employee.id}`);
    await expect(writer.page.getByLabel(/private.*e-?mail/i)).toHaveValue('private@example.test');
    await writer.page.getByLabel(/private.*e-?mail/i).fill('');
    await writer.page.getByRole('button', { name: /save.*draft|draft.*close/i }).click();
    await expect(writer.page).toHaveURL(/\/admin\/employees$/);
    await writer.page.goto(`/en/admin/employees/edit/${employee.id}`);
    await expect(writer.page.getByLabel(/private.*e-?mail/i)).toHaveValue('');
    const reloaded = await employeeGql(writer.page, 'query($id: ID!) { employeeById(employeeId:$id) { profile { privateEmail email } membership { roles { id } } } }', { id: employee.id });
    expect(reloaded.data.employeeById.profile.privateEmail).toBeNull();
    expect(reloaded.data.employeeById.membership.roles).toEqual([]);
  } finally { await writer.context.close(); }
});

test('real guards reject role escalation and unauthorized multipart import', async ({ page, browser }) => {
  await signInAsSuperAdmin(page);
  const orgId = await ensureActiveOrg(page);
  const writer = await employeeActor(browser, orgId, ['EMPLOYEE_READ','EMPLOYEE_WRITE']);
  const reader = await employeeActor(browser, orgId, ['EMPLOYEE_READ']);
  try {
    const roles = await employeeGql(page, '{ rolesByOrgId { id name } }');
    const owner = roles.data.rolesByOrgId.find((role: { name: string }) => role.name === 'ORG_OWNER');
    const result = await employeeGql(writer.page, 'mutation($input:EmployeeOnboardingInput!) { upsertEmployeeOnboardingDraft(input:$input) { id } }', { input: { firstName:'Denied',lastName:'Role',email:`denied-${Date.now()}@example.test`,roleIds:[owner.id] } });
    expect(result.errors?.length).toBeGreaterThan(0);
    const csv = await reader.page.request.post('http://localhost:4101/api/employees/upload', { multipart: { file: { name: 'employees.csv', mimeType: 'text/csv', buffer: Buffer.from('email;firstName;lastName\nx@example.test;X;Y') } } });
    expect(csv.status()).toBe(403);
    const rows = await employeeGql(writer.page, '{ employeesByOrgId { firstName } }');
    expect(rows.data.employeesByOrgId.some((row: { firstName: string }) => row.firstName === 'Denied')).toBe(false);
  } finally { await writer.context.close(); await reader.context.close(); }
});
