import { ForbiddenException } from '@nestjs/common';
import { UserEmailsResolver } from './user-emails.resolver';
import { UserEmailsService } from './user-emails.service';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SUPER_ADMIN_KEY } from '@/auth/decorators/super-admin.decorator';

describe('UserEmailsResolver ownership', () => {
  const owner: TokenPayload = { sub: 'owner' };
  const foreign: TokenPayload = {
    sub: 'foreign',
    permissions: ['EMPLOYEE_READ', 'EMPLOYEE_WRITE'],
  };
  const email = {
    id: 'email',
    userId: owner.sub,
    email: 'private@example.test',
  };
  const service = { findByUserId: jest.fn(), findOne: jest.fn() };
  const resolver = new UserEmailsResolver(
    service as unknown as UserEmailsService,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    service.findByUserId.mockResolvedValue([email]);
    service.findOne.mockResolvedValue(email);
  });
  it('returns own addresses through both query paths', async () => {
    await expect(resolver.findByUserId(owner.sub, owner)).resolves.toEqual([
      email,
    ]);
    await expect(resolver.findOne(email.id, owner)).resolves.toEqual(email);
  });
  it('does not load another account address list even with employee permissions', () => {
    expect(() => resolver.findByUserId(owner.sub, foreign)).toThrow(
      ForbiddenException,
    );
    expect(service.findByUserId).not.toHaveBeenCalled();
  });
  it('does not expose a foreign address when its identifier is known', async () => {
    await expect(resolver.findOne(email.id, foreign)).rejects.toThrow(
      ForbiddenException,
    );
  });
  it('permits explicit superadmin access', async () => {
    const admin = { ...foreign, isSuperAdmin: true };
    await expect(resolver.findByUserId(owner.sub, admin)).resolves.toEqual([
      email,
    ]);
    await expect(resolver.findOne(email.id, admin)).resolves.toEqual(email);
  });
  it.each(['addUserEmail', 'setPrimaryUserEmail', 'removeUserEmail'] as const)(
    'keeps %s restricted to superadmins',
    (method) => {
      expect(
        Reflect.getMetadata(
          SUPER_ADMIN_KEY,
          Object.getOwnPropertyDescriptor(UserEmailsResolver.prototype, method)!
            .value,
        ),
      ).toBe(true);
    },
  );
});
