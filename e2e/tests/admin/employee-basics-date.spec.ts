import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { signInAsSuperAdmin, ensureActiveOrg } from '../helpers/auth';
import { employeeActor, employeeGql } from '../helpers/employee-test-fixtures';

for (const scenario of [
  { zone:'Europe/Zurich',month:'09',label:'summer' },
  { zone:'Europe/Zurich',month:'01',label:'winter' },
  { zone:'America/Los_Angeles',month:'09',label:'negative UTC' },
]) {
  test(`birthday calendar day survives UI save and reload in ${scenario.zone} ${scenario.label}`, async ({ page,browser }) => {
    await signInAsSuperAdmin(page);
    const org = await ensureActiveOrg(page);
    const writer = await employeeActor(browser,org,['EMPLOYEE_READ','EMPLOYEE_WRITE'],{ timezoneId:scenario.zone,locale:'en-US' });
    try {
      await writer.page.clock.setFixedTime(new Date(`2026-${scenario.month}-10T00:15:00Z`));
      await writer.page.goto('/en/admin/employees/edit');
      const email = `date-${randomUUID()}@example.test`;
      await writer.page.getByLabel(/first name/i).fill('Calendar');
      await writer.page.getByLabel(/last name/i).fill('Roundtrip');
      await writer.page.getByLabel(/e-?mail/i).first().fill(email);
      await writer.page.getByLabel(/date of birth/i).click();
      await writer.page.locator(`[data-day="${Number(scenario.month)}/1/2026"]`).click();
      await writer.page.keyboard.press('Escape');
      await writer.page.getByRole('button',{ name:/save.*draft|draft.*close/i }).click();
      await expect(writer.page).toHaveURL(/\/admin\/employees$/);
      const list = await employeeGql(writer.page,'{ employeesByOrgId { id profile { email dateOfBirth } } }');
      expect(list.errors).toBeUndefined();
      const saved = list.data.employeesByOrgId.find((employee:{ profile:{ email:string } }) => employee.profile.email===email);
      expect(saved.profile.dateOfBirth).toBe(`2026-${scenario.month}-01`);
      await writer.page.goto(`/en/admin/employees/edit/${saved.id}`);
      await expect(writer.page.getByLabel(/date of birth/i)).toContainText(scenario.month==='09' ? '1. September 2026' : '1. Januar 2026');
    } finally { await writer.context.close(); }
  });
}
