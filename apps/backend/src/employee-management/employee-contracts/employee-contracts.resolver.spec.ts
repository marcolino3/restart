import { protectedFieldKey } from '@restart/shared-schemas/rbac/field-catalog';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { hiddenByPermission } from './employee-contracts.resolver';

describe('hiddenByPermission', () => {
  it('exempts a field the caller cannot read', () => {
    const user = {
      fieldPermissions: new Map([
        [
          protectedFieldKey('employeeContract', 'hourlyRate'),
          new Set(['read', 'create', 'update']),
        ],
      ]),
    } as unknown as TokenPayload;

    const hidden = hiddenByPermission(user);
    expect(hidden?.has('grossSalary')).toBe(true);
    expect(hidden?.has('hourlyRate')).toBe(false);
  });

  it('returns undefined for superadmin (no exemption, no restriction)', () => {
    const user = { isSuperAdmin: true } as TokenPayload;
    expect(hiddenByPermission(user)).toBeUndefined();
  });

  it('returns undefined when the token carries no field-permission map', () => {
    const user = {} as TokenPayload;
    expect(hiddenByPermission(user)).toBeUndefined();
  });
});
