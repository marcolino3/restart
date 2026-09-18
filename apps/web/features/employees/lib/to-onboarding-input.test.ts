import { describe, expect, it } from 'vitest';
import { EmployeeOnboardingFormSchema } from '../schemas/employee-onboarding-form.schema';
import { toOnboardingInput } from './to-onboarding-input';

describe('employee basis PATCH transport', () => {
  const values = () => EmployeeOnboardingFormSchema.parse({ firstName: 'Anna', lastName: 'Test', email: 'anna@example.test' });
  it.each(['title', 'socialSecurityNumber', 'privateEmail', 'contactPhone', 'contactPhone2', 'street', 'houseNumber', 'addressLine2', 'postalCode', 'city', 'country', 'avatarUrl'])('clears %s explicitly', (field) => {
    const input = toOnboardingInput({ ...values(), [field]: '' }, [field]);
    expect(JSON.parse(JSON.stringify(input))).toHaveProperty(field, null);
  });
  it('clears date of birth explicitly', () => {
    expect(toOnboardingInput({ ...values(), dateOfBirth: null }, ['dateOfBirth'])).toHaveProperty('dateOfBirth', null);
  });
  it('keeps a calendar date byte-for-byte', () => {
    expect(toOnboardingInput({ ...values(), dateOfBirth: '1990-06-15' }, ['dateOfBirth'])).toHaveProperty('dateOfBirth', '1990-06-15');
  });
  it('omits roles, contract and unseen personal fields on a phone-only change', () => {
    const input = toOnboardingInput({ ...values(), contactPhone: '+41791234567', roleId: '5fa7fa65-21d3-407a-9395-a9f2a9568158', startDate: new Date('2026-01-01') }, ['contactPhone']);
    expect(JSON.parse(JSON.stringify(input))).toEqual({ firstName: 'Anna', lastName: 'Test', contactPhone: '+41791234567' });
  });
  it('includes roles only when explicitly changed, including a clear', () => {
    expect(toOnboardingInput(values(), ['roleId'])).toHaveProperty('roleIds', []);
    expect(toOnboardingInput(values(), ['street'])).not.toHaveProperty('roleIds');
  });
});
