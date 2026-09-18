import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFormContext } from 'react-hook-form';
const mocks = vi.hoisted(() => ({ save: vi.fn(), finalize: vi.fn(), push: vi.fn(), error: vi.fn() }));
vi.mock('next-intl', () => ({ useLocale: () => 'de', useTranslations: () => (key: string) => key }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: vi.fn() } }));
vi.mock('../../actions/employee-onboarding.actions', () => ({ upsertEmployeeOnboardingDraftAction: mocks.save, finalizeEmployeeOnboardingAction: mocks.finalize }));
vi.mock('./steps/StepPerson', () => ({ StepPerson: () => {
  const form = useFormContext();
  return <><input aria-label="firstName" {...form.register('firstName')} /><span>{String(form.formState.errors.firstName?.message ?? '')}</span></>;
} }));
vi.mock('./steps/StepContract', () => ({ StepContract: () => null }));
vi.mock('./steps/StepRoles', () => ({ StepRoles: () => null }));
vi.mock('./OnboardingSummaryAside', () => ({ OnboardingSummaryAside: () => null }));
import { EmployeeOnboardingWizard } from './EmployeeOnboardingWizard';

const id = '5fa7fa65-21d3-407a-9395-a9f2a9568158';
const initialValues = { id, version:1, firstName: 'Anna', lastName: 'Test', email: 'anna@example.test', startDate: new Date('2026-01-01'), roleId: id };
const success = { success: true, data: { id, version:2, status: 'DRAFT', invitationStatus: 'PENDING' } };
const mount = (overrides: Partial<typeof initialValues> = {}, employeeStatus?: 'ACTIVE' | 'DRAFT') => render(<EmployeeOnboardingWizard roleOptions={[]} teamOptions={[]} employeeFunctions={[]} initialValues={{ ...initialValues,...overrides }} employeeStatus={employeeStatus} />);
const advance = async () => {
  fireEvent.click(screen.getByText('next'));
  await waitFor(() => expect(screen.getByText('step_contract')).toHaveAttribute('aria-current', 'step'));
  fireEvent.click(screen.getByText('next'));
  await waitFor(() => expect(screen.getByText('step_roles')).toHaveAttribute('aria-current', 'step'));
};

describe('wizard save coordination', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.save.mockResolvedValue(success); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  it('recovers from an action exception without navigating', async () => {
    mocks.save.mockRejectedValue(new Error('network'));
    mount();
    fireEvent.click(screen.getByText('saveDraftClose'));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(screen.getByText('saveDraftClose')).not.toBeDisabled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
  it('never finalizes when the latest save fails', async () => {
    mount();
    fireEvent.click(screen.getByText('next'));
    await waitFor(() => expect(screen.getByText('step_contract')).toHaveAttribute('aria-current', 'step'));
    fireEvent.click(screen.getByText('next'));
    await waitFor(() => expect(screen.getByText('createAndInvite')).toBeInTheDocument());
    mocks.save.mockResolvedValue({ success: false, error: 'conflict' });
    fireEvent.click(screen.getByText('createAndInvite'));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(mocks.finalize).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByText('createAndInvite')).not.toBeDisabled();
  });
  it('keeps one save in flight and saves edits made during that request before leaving', async () => {
    let resolve!: (value: typeof success) => void;
    mocks.save.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    mount();
    fireEvent.click(screen.getByText('saveDraftClose'));
    fireEvent.click(screen.getByText('saveDraftClose'));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('firstName'), { target: { value: 'Latest' } });
    await act(async () => resolve(success));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(mocks.save.mock.calls[1][0].firstName).toBe('Latest');
  });
  it('does not save invalid mandatory person fields', async () => {
    mount({ firstName:'' });
    fireEvent.click(screen.getByText('next'));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('personIncomplete'));
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('does not advance a draft without an entry date', async () => {
    mount({ startDate:undefined });
    fireEvent.click(screen.getByText('next'));
    await waitFor(() => expect(screen.getByText('step_contract')).toHaveAttribute('aria-current','step'));
    mocks.save.mockClear();
    fireEvent.click(screen.getByText('next'));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('entryDateRequired'));
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('does not finalize a draft without an assigned role', async () => {
    mount({ roleId:undefined });
    await advance();
    fireEvent.click(screen.getByText('createAndInvite'));
    expect(mocks.error).toHaveBeenCalledWith('roleRequired');
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
  it('finalizes the latest returned version before navigating', async () => {
    mocks.finalize.mockResolvedValue({ success:true });
    mount();
    await advance();
    fireEvent.click(screen.getByText('createAndInvite'));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/de/admin/employees'));
    expect(mocks.finalize).toHaveBeenCalledWith({ id,expectedVersion:2,invitationTiming:'IMMEDIATE' });
  });
  it.each(['rejection','exception'])('recovers from a finalize %s without navigating', async (mode) => {
    if (mode === 'rejection') mocks.finalize.mockResolvedValue({ success:false });
    else mocks.finalize.mockRejectedValue(new Error('network'));
    mount();
    await advance();
    fireEvent.click(screen.getByText('createAndInvite'));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('finalizeError'));
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByText('createAndInvite')).toBeEnabled();
  });
  it('saves an active employee without repeating finalization or inviting again', async () => {
    mount({},'ACTIVE');
    await advance();
    fireEvent.click(screen.getByText('saveChanges'));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(`/de/admin/employees/${id}`));
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
  it('shows server field errors and keeps invalid save-and-close on the page', async () => {
    mocks.save.mockResolvedValue({ success:false,fieldErrors:{ firstName:['Server field error'],lastName:[] } });
    mount();
    fireEvent.click(screen.getByText('saveDraftClose'));
    await screen.findByText('Server field error');
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it('rejects an invalid save-and-close before calling the action', async () => {
    mount({ firstName:'' });
    fireEvent.click(screen.getByText('saveDraftClose'));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('personIncomplete'));
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('does not leave the contract step after a save failure', async () => {
    mount();
    fireEvent.click(screen.getByText('next'));
    await waitFor(() => expect(screen.getByText('step_contract')).toHaveAttribute('aria-current','step'));
    mocks.save.mockResolvedValue({ success:false });
    fireEvent.click(screen.getByText('next'));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('saveError'));
    expect(screen.getByText('step_contract')).toHaveAttribute('aria-current','step');
  });
  it('warns on unsaved browser navigation and asks before discarding edits', () => {
    mount({},'ACTIVE');
    const clean = new Event('beforeunload', { cancelable:true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    fireEvent.change(screen.getByLabelText('firstName'), { target:{ value:'Changed' } });
    const dirty = new Event('beforeunload', { cancelable:true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
    const confirm = vi.spyOn(window,'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByText('cancel'));
    expect(confirm).toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByText('cancel'));
    expect(mocks.push).toHaveBeenCalledWith('/de/admin/employees');
  });
  it('allows clean cancellation without a discard prompt', () => {
    const confirm = vi.spyOn(window,'confirm');
    mount();
    fireEvent.click(screen.getByText('cancel'));
    expect(confirm).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalled();
  });
  it('supports back navigation and validates forward step indicators', async () => {
    mount();
    fireEvent.click(screen.getByText('step_roles'));
    await waitFor(() => expect(screen.getByText('step_contract')).toHaveAttribute('aria-current','step'));
    fireEvent.click(screen.getByText('back'));
    expect(screen.getByText('step_person')).toHaveAttribute('aria-current','step');
    fireEvent.click(screen.getByText('next'));
    await waitFor(() => expect(screen.getByText('step_contract')).toHaveAttribute('aria-current','step'));
    fireEvent.click(screen.getByText('step_person'));
    expect(screen.getByText('step_person')).toHaveAttribute('aria-current','step');
  });
  it('debounces draft edits and cancels queued autosaves on unmount', async () => {
    vi.useFakeTimers();
    const view = mount();
    fireEvent.change(screen.getByLabelText('firstName'), { target:{ value:'First edit' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    fireEvent.change(screen.getByLabelText('firstName'), { target:{ value:'Latest edit' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(1499); });
    expect(mocks.save).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(mocks.save.mock.calls[0][0].firstName).toBe('Latest edit');
    fireEvent.change(screen.getByLabelText('firstName'), { target:{ value:'Unmounted edit' } });
    view.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
  it('does not autosave active employee edits', async () => {
    vi.useFakeTimers();
    mount({},'ACTIVE');
    fireEvent.change(screen.getByLabelText('firstName'), { target:{ value:'Pending edit' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('saves and closes an active employee directly to the detail page', async () => {
    mount({},'ACTIVE');
    fireEvent.click(screen.getByText('saveAndClose'));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(`/de/admin/employees/${id}`));
    expect(mocks.finalize).not.toHaveBeenCalled();
  });

  it('does not navigate or start another save when a pending save finishes after unmount', async () => {
    let resolve!: (value: typeof success) => void;
    mocks.save.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const view = mount();
    fireEvent.click(screen.getByText('saveDraftClose'));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('firstName'), { target:{ value:'Later edit' } });
    view.unmount();
    await act(async () => resolve(success));
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
  it('does not navigate after an unmounted finalization returns', async () => {
    let resolve!: (value: { success:boolean }) => void;
    mocks.finalize.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const view = mount();
    await advance();
    fireEvent.click(screen.getByText('createAndInvite'));
    await waitFor(() => expect(mocks.finalize).toHaveBeenCalledTimes(1));
    view.unmount();
    await act(async () => resolve({ success:true }));
    expect(mocks.push).not.toHaveBeenCalled();
  });

});
