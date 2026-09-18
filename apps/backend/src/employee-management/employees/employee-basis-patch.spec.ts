import { Persona } from '@/common/enums/persona.enum';
import type { Membership } from '@/memberships/entities/membership.entity';
import { applyEmployeeBasisPatch } from './employee-basis-patch';
import type { Employee } from './entities/employee.entity';
import type { EmployeeOnboardingInput } from './dto/employee-onboarding.input';

describe('organization basis patch semantics', () => {
  let employee: Employee;
  let membership: Membership;
  const optional = {
    title: 'Dr.',
    dateOfBirth: '2000-02-29',
    socialSecurityNumber: '756.1234.5678.97',
    privateEmail: 'private@example.test',
    street: 'Main Street',
    houseNumber: '12',
    addressLine2: 'Floor 2',
    postalCode: '8000',
    city: 'Zürich',
    country: 'CH',
    avatarUrl: '/employees/photo.webp',
    language: 'de',
  };
  const input = (patch: object = {}) =>
    ({
      firstName: 'Anna',
      lastName: 'Local',
      ...patch,
    }) as EmployeeOnboardingInput;
  beforeEach(() => {
    employee = {
      organizationId: 'org',
      timeTrackingEnabled: false,
      profile: {
        firstName: 'Anna',
        lastName: 'Local',
        email: 'anna@example.test',
      },
    } as Employee;
    membership = {
      persona: Persona.EMPLOYEE,
      roles: [{ id: 'role' }],
      user: { firstName: 'Global name' },
    } as Membership;
  });
  it.each(Object.entries(optional))(
    'sets, preserves and clears %s with matching audit values',
    (key, value) => {
      const first = applyEmployeeBasisPatch(
        employee,
        membership,
        input({ [key]: ` ${value} ` }),
      );
      expect(employee.profile[key]).toBe(value);
      expect(first).toContainEqual(
        expect.objectContaining({
          fieldName: key,
          oldValue: null,
          newValue: value,
        }),
      );
      expect(applyEmployeeBasisPatch(employee, membership, input())).toEqual(
        [],
      );
      expect(employee.profile[key]).toBe(value);
      expect(
        applyEmployeeBasisPatch(employee, membership, input({ [key]: value })),
      ).toEqual([]);
      const cleared = applyEmployeeBasisPatch(
        employee,
        membership,
        input({ [key]: null }),
      );
      expect(employee.profile[key]).toBeNull();
      expect(cleared).toContainEqual(
        expect.objectContaining({
          fieldName: key,
          oldValue: value,
          newValue: null,
        }),
      );
    },
  );
  it('normalizes invitation email while leaving global account and roles untouched', () => {
    const globalUser = membership.user,
      roles = membership.roles;
    applyEmployeeBasisPatch(
      employee,
      membership,
      input({ email: ' NEW@EXAMPLE.TEST ' }),
    );
    expect(employee.profile.email).toBe('new@example.test');
    expect(membership.user).toBe(globalUser);
    expect(membership.user?.firstName).toBe('Global name');
    expect(membership.roles).toBe(roles);
    expect(employee.organizationId).toBe('org');
  });
  it('updates membership phones, persona and tracking flags with no-op detection', () => {
    const patch = input({
      contactPhone: ' +41 1 ',
      contactPhone2: ' +41 2 ',
      persona: Persona.TEACHER,
      timeTrackingEnabled: true,
    });
    expect(applyEmployeeBasisPatch(employee, membership, patch)).toHaveLength(
      4,
    );
    expect(membership.contactPhone).toBe('+41 1');
    expect(membership.contactPhone2).toBe('+41 2');
    expect(membership.persona).toBe(Persona.TEACHER);
    expect(employee.timeTrackingEnabled).toBe(true);
    expect(applyEmployeeBasisPatch(employee, membership, patch)).toEqual([]);
    expect(
      applyEmployeeBasisPatch(
        employee,
        membership,
        input({
          contactPhone: null,
          contactPhone2: ' ',
          timeTrackingEnabled: false,
        }),
      ),
    ).toHaveLength(3);
    expect(membership.contactPhone).toBeNull();
    expect(membership.contactPhone2).toBeNull();
  });
});
