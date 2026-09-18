import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Role } from './entities/role.entity';
import { RoleFieldPermission } from './entities/role-field-permission.entity';

export function assertRoleAssignmentActor(
  actor: TokenPayload | undefined,
  orgId: string,
): asserts actor is TokenPayload {
  if (
    !orgId ||
    actor?.orgId !== orgId ||
    (!actor.isSuperAdmin && !actor.permissions?.includes('ROLE_ASSIGN'))
  ) {
    throw new ForbiddenException(
      'ROLE_ASSIGN in the active organization is required',
    );
  }
}

/** Caller must use a transaction. The organization lock serializes owner changes. */
export async function assignMembershipRoles(
  manager: EntityManager,
  membership: Membership,
  roleIds: string[],
  orgId: string,
  actor: TokenPayload | undefined,
): Promise<void> {
  assertRoleAssignmentActor(actor, orgId);
  if (membership.organizationId !== orgId)
    throw new ForbiddenException('Foreign membership');
  await manager.findOneOrFail(Organization, {
    where: { id: orgId },
    lock: { mode: 'pessimistic_write' },
  });
  const ids = [...new Set(roleIds)];
  const roles = ids.length
    ? await manager.find(Role, {
        where: { id: In(ids), organizationId: orgId },
        relations: ['permissions'],
      })
    : [];
  if (roles.length !== ids.length)
    throw new BadRequestException(
      'One or more roles do not belong to this organization',
    );
  if (!actor.isSuperAdmin) {
    if (
      roles.some((role) =>
        role.permissions?.some(
          (permission) => !actor.permissions?.includes(permission.code),
        ),
      )
    ) {
      throw new ForbiddenException('Cannot grant permissions you do not have');
    }
    const fields = ids.length
      ? await manager.find(RoleFieldPermission, { where: { roleId: In(ids) } })
      : [];
    if (
      fields.some((field) =>
        field.actions.some(
          (action) =>
            !actor.fieldPermissions
              ?.get(`${field.resource}.${field.field}`)
              ?.has(action),
        ),
      )
    ) {
      throw new ForbiddenException(
        'Cannot grant field permissions you do not have',
      );
    }
  }
  const members = await manager.find(Membership, {
    where: { organizationId: orgId },
    relations: ['roles', 'roles.permissions'],
  });
  const owns = (rs: Role[] | undefined) =>
    rs?.some((r) =>
      r.permissions?.some((p) => String(p.code) === 'ORG_TRANSFER_OWNERSHIP'),
    );
  const current = members.find((m) => m.id === membership.id);
  if (
    owns(current?.roles) &&
    !owns(roles) &&
    !members.some((m) => m.id !== membership.id && m.isActive && owns(m.roles))
  ) {
    throw new ConflictException(
      'Cannot remove the last owner of this organization',
    );
  }
  // Persist the relation only: do not overwrite a concurrently edited profile.
  await manager.save(Membership, { id: membership.id, roles });
  membership.roles = roles;
}
