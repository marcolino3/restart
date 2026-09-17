import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ client: vi.fn(), request: vi.fn() }));
vi.mock('@/lib/graphql/server-cookie-graphql-client', () => ({ serverCookieGqlClient: mocks.client }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-intl/server', () => ({ getLocale: async () => 'de' }));
import { upsertEmployeeOnboardingDraftAction, finalizeEmployeeOnboardingAction, sendEmployeeInvitationAction, removeEmployeeDraftAction } from './employee-onboarding.actions';
import { revalidatePath } from 'next/cache';
import { EmployeeOnboardingFormSchema } from '../schemas/employee-onboarding-form.schema';

describe('employee onboarding action failure handling', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.client.mockResolvedValue({ request: mocks.request }); });
  it('returns field errors for invalid optional email without contacting the backend', async () => {
    const values = EmployeeOnboardingFormSchema.parse({ firstName: 'Anna', lastName: 'Test' });
    const result = await upsertEmployeeOnboardingDraftAction({ ...values, privateEmail: 'bad' });
    expect(result.success).toBe(false);
    expect(result).toHaveProperty('fieldErrors.privateEmail');
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it('returns a structured failure even if client creation throws', async () => {
    mocks.client.mockRejectedValue(new Error('Connection unavailable'));
    const values = EmployeeOnboardingFormSchema.parse({ firstName: 'Anna', lastName: 'Test' });
    await expect(upsertEmployeeOnboardingDraftAction(values)).resolves.toMatchObject({ success: false });
  });
  it('saves basis changes independently of an unchanged incomplete contract', async () => {
    mocks.request.mockResolvedValue({ upsertEmployeeOnboardingDraft: { id: 'saved', version:2 } });
    const values = EmployeeOnboardingFormSchema.parse({ firstName:'Anna',lastName:'Test',email:'anna@example.test' });
    const result = await upsertEmployeeOnboardingDraftAction({ ...values, startDate:new Date('2026-09-01'),endDate:new Date('2026-08-01'),street:'New' }, ['street']);
    expect(result.success).toBe(true);
    expect(mocks.request.mock.calls[0][1].input).not.toHaveProperty('contract');
    expect(mocks.request.mock.calls[0][1].input.street).toBe('New');
  });
  it('still validates explicitly changed contract dates', async () => {
    const values = EmployeeOnboardingFormSchema.parse({ firstName:'Anna',lastName:'Test' });
    const result = await upsertEmployeeOnboardingDraftAction({ ...values,startDate:new Date('2026-09-01'),endDate:new Date('2026-08-01') }, ['endDate']);
    expect(result.success).toBe(false);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it('does not return transport or SQL details', async () => {
    mocks.client.mockRejectedValue(new Error('SQL password=secret'));
    const values = EmployeeOnboardingFormSchema.parse({ firstName:'Anna',lastName:'Test' });
    const result = await upsertEmployeeOnboardingDraftAction(values);
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it.each([['CONFLICT','Employee was changed; reload before saving'],['FORBIDDEN','Permission denied']])('returns an actionable %s failure without invalidating cached data', async (code,error) => {
    mocks.request.mockRejectedValue({ response:{ errors:[{ extensions:{ code } }] } });
    const values = EmployeeOnboardingFormSchema.parse({ firstName:'Anna',lastName:'Test' });
    await expect(upsertEmployeeOnboardingDraftAction(values)).resolves.toEqual({ success:false,error });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('invalidates list and both employee pages after an existing profile is saved', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    mocks.request.mockResolvedValue({ upsertEmployeeOnboardingDraft:{ id,version:2 } });
    const values = EmployeeOnboardingFormSchema.parse({ id,version:1,firstName:'Anna',lastName:'Test' });
    await upsertEmployeeOnboardingDraftAction(values,['firstName']);
    expect(revalidatePath).toHaveBeenCalledWith('/de/admin/employees');
    expect(revalidatePath).toHaveBeenCalledWith(`/de/admin/employees/${id}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/de/admin/employees/edit/${id}`);
  });
  it.each(['finalize','invite','delete'])('%s invalidates the list only after backend success', async (kind) => {
    mocks.request.mockResolvedValue({ finalizeEmployeeOnboarding:{ id:'employee',status:'ACTIVE' },sendEmployeeInvitation:{ id:'employee',invitationStatus:'SENT' } });
    const invoke = () => kind === 'finalize' ? finalizeEmployeeOnboardingAction({ id:'employee',expectedVersion:3,invitationTiming:'MANUAL' }) : kind === 'invite' ? sendEmployeeInvitationAction('employee') : removeEmployeeDraftAction('employee');
    await expect(invoke()).resolves.toMatchObject({ success:true });
    expect(revalidatePath).toHaveBeenCalledWith('/de/admin/employees');
    vi.mocked(revalidatePath).mockClear();
    mocks.request.mockRejectedValue(new Error('SQL password=secret'));
    const failed = await invoke();
    expect(failed.success).toBe(false);
    expect(JSON.stringify(failed)).not.toContain('secret');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
