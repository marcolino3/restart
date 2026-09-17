import { fieldPermissionMiddleware } from './field-permission.middleware';

describe('employee and global account field boundaries', () => {
  const next = jest.fn(() => Promise.resolve('private value'));
  const read = (
    parentType: string,
    fieldName: string,
    source: object,
    user?: object,
  ) =>
    fieldPermissionMiddleware(
      {
        info: { parentType: { name: parentType }, fieldName },
        source,
        context: { req: { user } },
      } as never,
      next,
    );
  beforeEach(() => next.mockClear());
  it.each([
    'dateOfBirth',
    'socialSecurityNumber',
    'privateEmail',
    'street',
    'houseNumber',
    'addressLine2',
    'postalCode',
    'city',
    'country',
  ])(
    'hides another global account %s even from an employee writer',
    async (field) => {
      expect(
        await read(
          'User',
          field,
          { id: 'other' },
          {
            sub: 'writer',
            orgId: 'org',
            permissions: ['EMPLOYEE_READ', 'EMPLOYEE_WRITE'],
          },
        ),
      ).toBeNull();
      expect(next).not.toHaveBeenCalled();
    },
  );
  it('lets an account read its own private profile', async () => {
    expect(
      await read('User', 'privateEmail', { id: 'self' }, { sub: 'self' }),
    ).toBe('private value');
  });
  it('hides global email collections of other accounts', async () => {
    expect(
      await read(
        'User',
        'userEmails',
        { id: 'other' },
        { sub: 'writer', permissions: ['EMPLOYEE_READ'] },
      ),
    ).toEqual([]);
    expect(next).not.toHaveBeenCalled();
  });
  it.each([
    undefined,
    { orgId: 'other', permissions: ['EMPLOYEE_READ'] },
    { orgId: 'org', permissions: ['SCHOOL_CLASS_READ'] },
    { isSuperAdmin: true },
    { orgId: 'other', isSuperAdmin: true },
  ])(
    'blocks private employee projection without scoped read authorization %#',
    async (user) => {
      expect(
        await read('Employee', 'profile', { organizationId: 'org' }, user),
      ).toBeNull();
      expect(next).not.toHaveBeenCalled();
    },
  );
  it('allows the scoped employee reader', async () => {
    expect(
      await read(
        'Employee',
        'profile',
        { organizationId: 'org' },
        { orgId: 'org', permissions: ['EMPLOYEE_READ'] },
      ),
    ).toBe('private value');
  });
  it('keeps directory names available without exposing the profile', async () => {
    expect(
      await read(
        'Employee',
        'firstName',
        { organizationId: 'org' },
        { orgId: 'org', permissions: ['SCHOOL_CLASS_READ'] },
      ),
    ).toBe('private value');
  });
  it('continues protecting audit values with field permissions', async () => {
    expect(
      await read(
        'EmployeeAuditLog',
        'newValue',
        {},
        { permissions: ['EMPLOYEE_READ'], fieldPermissions: new Map() },
      ),
    ).toBeNull();
    expect(
      await read(
        'EmployeeAuditLog',
        'newValue',
        {},
        {
          permissions: ['EMPLOYEE_READ'],
          fieldPermissions: new Map([
            ['employeeAuditLog.newValue', new Set(['read'])],
          ]),
        },
      ),
    ).toBe('private value');
  });
});
