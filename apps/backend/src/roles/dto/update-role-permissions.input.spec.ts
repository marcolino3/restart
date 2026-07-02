import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateRolePermissionsInput } from './update-role-permissions.input';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';

const VALID_ROLE_ID = 'b6f2f2a0-0000-4000-8000-000000000000';

async function validateInput(plain: Record<string, unknown>) {
  const input = plainToInstance(UpdateRolePermissionsInput, plain);
  return validate(input);
}

describe('UpdateRolePermissionsInput (regression: input was unvalidated)', () => {
  it('accepts a valid roleId with known permission codes', async () => {
    const errors = await validateInput({
      roleId: VALID_ROLE_ID,
      permissionCodes: [PermissionCode.ROLE_ASSIGN, PermissionCode.USER_INVITE],
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID roleId', async () => {
    const errors = await validateInput({
      roleId: "1'; DROP TABLE roles; --",
      permissionCodes: [PermissionCode.ROLE_ASSIGN],
    });
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
  });

  it('rejects permission codes outside the catalog enum', async () => {
    const errors = await validateInput({
      roleId: VALID_ROLE_ID,
      permissionCodes: ['TOTALLY_MADE_UP'],
    });
    expect(errors.some((e) => e.property === 'permissionCodes')).toBe(true);
  });

  it('rejects oversized permission arrays', async () => {
    const errors = await validateInput({
      roleId: VALID_ROLE_ID,
      permissionCodes: Array.from(
        { length: 101 },
        () => PermissionCode.ROLE_ASSIGN,
      ),
    });
    expect(errors.some((e) => e.property === 'permissionCodes')).toBe(true);
  });
});
