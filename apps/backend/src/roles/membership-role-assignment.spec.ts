import { EntityManager } from 'typeorm';
import { assignMembershipRoles } from './membership-role-assignment';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from './entities/role.entity';
import { RoleFieldPermission } from './entities/role-field-permission.entity';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

describe('membership role assignment authorization', () => {
  const actor: TokenPayload = {
    sub: 'actor',
    orgId: 'org',
    permissions: ['ROLE_ASSIGN', 'EMPLOYEE_READ'],
  };
  let roles: unknown[];
  let fields: unknown[];
  let members: unknown[];
  const manager = {
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };
  const membership = { id: 'member', organizationId: 'org' } as Membership;
  const assign = (ids: string[], caller: TokenPayload | undefined = actor) =>
    assignMembershipRoles(
      manager as unknown as EntityManager,
      membership,
      ids,
      'org',
      caller,
    );
  beforeEach(() => {
    jest.clearAllMocks();
    roles = [{ id: 'reader', permissions: [{ code: 'EMPLOYEE_READ' }] }];
    fields = [];
    members = [];
    manager.find.mockImplementation((entity) =>
      Promise.resolve(
        entity === Role
          ? roles
          : entity === RoleFieldPermission
            ? fields
            : members,
      ),
    );
  });
  it.each([
    { ...actor, permissions: ['EMPLOYEE_WRITE'] },
    { ...actor, orgId: 'foreign' },
    { ...actor, orgId: undefined, isSuperAdmin: true },
  ])('rejects unauthorized actor before database access %#', async (caller) => {
    await expect(assign(['reader'], caller)).rejects.toThrow('ROLE_ASSIGN');
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.findOneOrFail).not.toHaveBeenCalled();
  });
  it('allows in-scope roles without writing profile fields', async () => {
    await assign(['reader', 'reader']);
    expect(manager.findOneOrFail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(manager.save).toHaveBeenCalledWith(Membership, {
      id: 'member',
      roles,
    });
  });
  it('rejects a foreign role', async () => {
    roles = [];
    await expect(assign(['foreign'])).rejects.toThrow('do not belong');
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('rejects permission escalation', async () => {
    roles = [
      { id: 'owner', permissions: [{ code: 'ORG_TRANSFER_OWNERSHIP' }] },
    ];
    await expect(assign(['owner'])).rejects.toThrow('Cannot grant permissions');
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('rejects field permission escalation', async () => {
    fields = [{ resource: 'employee', field: 'salary', actions: ['read'] }];
    await expect(assign(['reader'])).rejects.toThrow(
      'Cannot grant field permissions',
    );
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('accepts field rights already held by the actor', async () => {
    fields = [{ resource: 'employee', field: 'salary', actions: ['read'] }];
    await assign(['reader'], {
      ...actor,
      fieldPermissions: new Map([['employee.salary', new Set(['read'])]]),
    });
    expect(manager.save).toHaveBeenCalled();
  });
  it('protects the last owner even from a superadmin', async () => {
    members = [
      {
        id: 'member',
        isActive: true,
        roles: [{ permissions: [{ code: 'ORG_TRANSFER_OWNERSHIP' }] }],
      },
    ];
    await expect(assign([], { ...actor, isSuperAdmin: true })).rejects.toThrow(
      'last owner',
    );
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('permits removing an owner when another active owner remains', async () => {
    members = ['member', 'other'].map((id) => ({
      id,
      isActive: true,
      roles: [{ permissions: [{ code: 'ORG_TRANSFER_OWNERSHIP' }] }],
    }));
    await assign([]);
    expect(manager.save).toHaveBeenCalledWith(Membership, {
      id: 'member',
      roles: [],
    });
  });
});
