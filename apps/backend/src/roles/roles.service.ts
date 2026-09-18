import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import {
  assignMembershipRoles,
  assertRoleAssignmentActor,
} from './membership-role-assignment';
import { Organization } from '@/organizations/entities/organization.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RoleFieldPermission } from './entities/role-field-permission.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { PermissionsService } from '@/permissions/permissions.service';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';
import { RoleFieldPermissionEntryInput } from './dto/update-role-field-permissions.input';
import { PROTECTED_FIELD_KEYS } from '@restart/shared-schemas/rbac/field-catalog';

// Owner-transfer capability: deleting/stripping the last role in the org that
// grants this permission would leave the org unable to ever transfer
// ownership again.
const LAST_OWNER_GUARD_PERMISSION = PermissionCode.ORG_TRANSFER_OWNERSHIP;

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(RoleFieldPermission)
    private readonly roleFieldPermissionRepo: Repository<RoleFieldPermission>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async findAllByOrgId(orgId: string): Promise<Role[]> {
    if (!orgId) return [];
    return this.roleRepo.find({
      where: { organizationId: orgId },
      relations: ['permissions', 'memberships', 'memberships.user'],
      order: { isSystem: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string, orgId: string): Promise<Role> {
    if (!orgId) throw new NotFoundException(`Role ${id} not found`);
    const role = await this.roleRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async findFieldPermissions(
    roleId: string,
    orgId: string,
  ): Promise<RoleFieldPermission[]> {
    await this.findOne(roleId, orgId);
    return this.roleFieldPermissionRepo.find({ where: { roleId } });
  }

  async createRole(
    orgId: string,
    input: {
      name: string;
      description?: string;
      permissionCodes?: string[];
      duplicateFromRoleId?: string;
      membershipIds?: string[];
    },
    actorPermissions: string[],
    actor?: TokenPayload,
  ): Promise<Role> {
    if (!orgId) throw new ForbiddenException('No active organization');
    if (input.membershipIds?.length) assertRoleAssignmentActor(actor, orgId);
    return this.membershipRepo.manager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: orgId },
        lock: { mode: 'pessimistic_write' },
      });
      const roleRepo = manager.getRepository(Role);
      const fieldRepo = manager.getRepository(RoleFieldPermission);
      let permissionCodes = input.permissionCodes ?? [];
      let fieldPermissions: RoleFieldPermissionEntryInput[] = [];

      if (input.duplicateFromRoleId) {
        const source = await roleRepo.findOne({
          where: { id: input.duplicateFromRoleId, organizationId: orgId },
          relations: ['permissions'],
        });
        if (!source) throw new NotFoundException('Role not found');
        permissionCodes = (source.permissions ?? []).map((p) => p.code);
        const sourceFieldPermissions = await fieldRepo.find({
          where: { roleId: source.id },
        });
        fieldPermissions = sourceFieldPermissions.map((fp) => ({
          resource: fp.resource,
          field: fp.field,
          actions: fp.actions,
        }));
      }

      if (!actor?.isSuperAdmin) {
        this.assertNoEscalation(actorPermissions, permissionCodes);
        this.assertNoFieldEscalation(
          actor?.fieldPermissions ?? new Map<string, Set<string>>(),
          fieldPermissions,
        );
      }

      const permissions =
        await this.permissionsService.findByCodes(permissionCodes);

      const role = roleRepo.create({
        organizationId: orgId,
        name: input.name,
        description: input.description ?? null,
        systemCode: null,
        isSystem: false,
        permissions,
      });
      const saved = await roleRepo.save(role);

      if (fieldPermissions.length > 0) {
        await this.replaceFieldPermissions(
          saved.id,
          fieldPermissions,
          fieldRepo,
        );
      }

      if (input.membershipIds?.length) {
        const ids = [...new Set(input.membershipIds)];
        const memberships = await manager.find(Membership, {
          where: { id: In(ids), organizationId: orgId },
          relations: ['roles'],
        });
        if (memberships.length !== ids.length)
          throw new NotFoundException('One or more memberships not found');
        for (const membership of memberships) {
          await assignMembershipRoles(
            manager,
            membership,
            [...(membership.roles ?? []).map((r) => r.id), saved.id],
            orgId,
            actor,
          );
        }
      }

      return saved;
    });
  }

  async assignMembers(
    orgId: string,
    roleId: string,
    membershipIds: string[],
    actor?: TokenPayload,
  ): Promise<void> {
    assertRoleAssignmentActor(actor, orgId);
    await this.membershipRepo.manager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: orgId },
        lock: { mode: 'pessimistic_write' },
      });
      const ids = [...new Set(membershipIds)];
      const memberships = ids.length
        ? await manager.find(Membership, {
            where: { id: In(ids), organizationId: orgId },
            relations: ['roles'],
          })
        : [];
      if (memberships.length !== ids.length)
        throw new NotFoundException('One or more memberships not found');
      for (const membership of memberships) {
        await assignMembershipRoles(
          manager,
          membership,
          [...(membership.roles ?? []).map((r) => r.id), roleId],
          orgId,
          actor,
        );
      }
    });
  }

  async updateRoleMembers(
    orgId: string,
    roleId: string,
    membershipIds: string[],
    actor?: TokenPayload,
  ): Promise<Role> {
    assertRoleAssignmentActor(actor, orgId);
    await this.membershipRepo.manager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: orgId },
        lock: { mode: 'pessimistic_write' },
      });
      const role = await manager.findOne(Role, {
        where: { id: roleId, organizationId: orgId },
      });
      if (!role) throw new NotFoundException('Role not found');
      const members = await manager.find(Membership, {
        where: { organizationId: orgId },
        relations: ['roles'],
      });
      const targets = new Set(membershipIds);
      if ([...targets].some((id) => !members.some((m) => m.id === id)))
        throw new NotFoundException('One or more memberships not found');
      // Add owners before removing old assignments, permitting atomic transfers.
      members.sort(
        (a, b) => Number(targets.has(b.id)) - Number(targets.has(a.id)),
      );
      for (const membership of members) {
        const ids = (membership.roles ?? []).map((r) => r.id);
        if (ids.includes(roleId) === targets.has(membership.id)) continue;
        await assignMembershipRoles(
          manager,
          membership,
          targets.has(membership.id)
            ? [...ids, roleId]
            : ids.filter((id) => id !== roleId),
          orgId,
          actor,
        );
      }
    });
    return this.findOne(roleId, orgId);
  }

  async duplicateRole(
    orgId: string,
    sourceRoleId: string,
    name: string,
    actorPermissions: string[],
    actor?: TokenPayload,
  ): Promise<Role> {
    return this.createRole(
      orgId,
      { name, duplicateFromRoleId: sourceRoleId },
      actorPermissions,
      actor,
    );
  }

  async updateRole(
    orgId: string,
    input: {
      id: string;
      name?: string;
      description?: string;
      permissionCodes?: string[];
    },
    actorPermissions: string[],
    actorIsSuperAdmin = false,
  ): Promise<Role> {
    if (!orgId) throw new NotFoundException('Role not found');
    return this.membershipRepo.manager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: orgId },
        lock: { mode: 'pessimistic_write' },
      });
      const roleRepo = manager.getRepository(Role);
      const role = await roleRepo.findOne({
        where: { id: input.id, organizationId: orgId },
        relations: ['permissions'],
      });
      if (!role) throw new NotFoundException('Role not found');
      this.assertSystemRoleIdentityUnchanged(role, input);

      if (input.permissionCodes) {
        if (!actorIsSuperAdmin) {
          this.assertNoEscalation(actorPermissions, input.permissionCodes);
        }
        await this.assertNotStrippingLastOwnerRole(
          orgId,
          role,
          input.permissionCodes,
          roleRepo,
        );
        role.permissions = await this.permissionsService.findByCodes(
          input.permissionCodes,
        );
      }
      if (input.name !== undefined) role.name = input.name;
      if (input.description !== undefined) role.description = input.description;

      return roleRepo.save(role);
    });
  }

  async updateRolePermissions(
    roleId: string,
    permissionCodes: string[],
    orgId: string,
    actorPermissions: string[],
    actorIsSuperAdmin = false,
  ): Promise<Role> {
    return this.updateRole(
      orgId,
      { id: roleId, permissionCodes },
      actorPermissions,
      actorIsSuperAdmin,
    );
  }

  async updateRoleFieldPermissions(
    orgId: string,
    roleId: string,
    entries: RoleFieldPermissionEntryInput[],
    actorFieldPermissions: Map<string, Set<string>>,
    actorIsSuperAdmin = false,
  ): Promise<Role> {
    if (!orgId) throw new NotFoundException('Role not found');
    return this.membershipRepo.manager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: orgId },
        lock: { mode: 'pessimistic_write' },
      });
      const role = await manager.getRepository(Role).findOne({
        where: { id: roleId, organizationId: orgId },
        relations: ['permissions'],
      });
      if (!role) throw new NotFoundException('Role not found');
      if (!actorIsSuperAdmin) {
        this.assertNoFieldEscalation(actorFieldPermissions, entries);
      }

      await this.replaceFieldPermissions(
        roleId,
        entries,
        manager.getRepository(RoleFieldPermission),
      );
      return role;
    });
  }

  async deleteRole(orgId: string, roleId: string): Promise<boolean> {
    if (!orgId) throw new NotFoundException('Role not found');
    return this.membershipRepo.manager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: orgId },
        lock: { mode: 'pessimistic_write' },
      });
      const roleRepo = manager.getRepository(Role);
      const role = await roleRepo.findOne({
        where: { id: roleId, organizationId: orgId },
        relations: ['permissions'],
      });
      if (!role) throw new NotFoundException('Role not found');
      this.assertSystemRoleNotDeleted(role);
      await this.assertNotDeletingLastOwnerRole(orgId, role, roleRepo);
      await roleRepo.remove(role);
      return true;
    });
  }

  // System roles keep their identity (name/description) so seeding and
  // bootstrap stay reproducible, but their permissions are editable by anyone
  // holding ROLE_ASSIGN - escalation is still blocked by assertNoEscalation.
  private assertSystemRoleIdentityUnchanged(
    role: Role,
    input: { name?: string; description?: string },
  ): void {
    if (!role.isSystem) return;
    if (input.name !== undefined && input.name !== role.name) {
      throw new ForbiddenException(
        `System role "${role.name}" cannot be renamed`,
      );
    }
    if (
      input.description !== undefined &&
      input.description !== role.description
    ) {
      throw new ForbiddenException(
        `System role "${role.name}" description cannot be changed`,
      );
    }
  }

  private assertSystemRoleNotDeleted(role: Role): void {
    if (role.isSystem) {
      throw new ForbiddenException(
        `System role "${role.name}" cannot be deleted`,
      );
    }
  }

  // Vergebbare Permissions muessen Teilmenge der eigenen Permissions des
  // Handelnden sein - sonst kann sich jede Rolle mit ROLE_ASSIGN zum Owner
  // hochstufen.
  private assertNoEscalation(
    actorPermissions: string[],
    requestedCodes: string[],
  ): void {
    const actorSet = new Set(actorPermissions);
    const escalated = requestedCodes.filter((code) => !actorSet.has(code));
    if (escalated.length > 0) {
      throw new ForbiddenException(
        `Cannot grant permissions you do not have: ${escalated.join(', ')}`,
      );
    }
  }

  private assertNoFieldEscalation(
    actorFieldPermissions: Map<string, Set<string>>,
    entries: RoleFieldPermissionEntryInput[],
  ): void {
    for (const entry of entries) {
      const key = `${entry.resource}.${entry.field}`;
      if (!PROTECTED_FIELD_KEYS.has(key)) {
        throw new BadRequestException(`Unknown protected field "${key}"`);
      }
      const actorActions = actorFieldPermissions.get(key) ?? new Set();
      const escalated = entry.actions.filter(
        (action) => !actorActions.has(action),
      );
      if (escalated.length > 0) {
        throw new ForbiddenException(
          `Cannot grant field permissions you do not have for "${key}": ${escalated.join(', ')}`,
        );
      }
    }
  }

  private async assertNotStrippingLastOwnerRole(
    orgId: string,
    role: Role,
    newPermissionCodes: string[],
    roleRepo: Repository<Role>,
  ): Promise<void> {
    const currentlyGrants = (role.permissions ?? []).some(
      (p) => p.code === LAST_OWNER_GUARD_PERMISSION,
    );
    const willGrant = newPermissionCodes.includes(LAST_OWNER_GUARD_PERMISSION);
    if (!currentlyGrants || willGrant) return;

    const otherOwnerRoleCount = await this.countRolesWithPermission(
      orgId,
      LAST_OWNER_GUARD_PERMISSION,
      role.id,
      roleRepo,
    );
    if (otherOwnerRoleCount === 0) {
      throw new ConflictException(
        'Cannot remove the last role granting ownership transfer in this organization',
      );
    }
  }

  private async assertNotDeletingLastOwnerRole(
    orgId: string,
    role: Role,
    roleRepo: Repository<Role>,
  ): Promise<void> {
    const grantsOwnerTransfer = (role.permissions ?? []).some(
      (p) => p.code === LAST_OWNER_GUARD_PERMISSION,
    );
    if (!grantsOwnerTransfer) return;

    const otherOwnerRoleCount = await this.countRolesWithPermission(
      orgId,
      LAST_OWNER_GUARD_PERMISSION,
      role.id,
      roleRepo,
    );
    if (otherOwnerRoleCount === 0) {
      throw new ConflictException(
        'Cannot delete the last role granting ownership transfer in this organization',
      );
    }
  }

  private async countRolesWithPermission(
    orgId: string,
    permissionCode: string,
    excludeRoleId: string,
    roleRepo: Repository<Role>,
  ): Promise<number> {
    return roleRepo
      .createQueryBuilder('r')
      .innerJoin('r.permissions', 'p')
      .innerJoin('r.memberships', 'm')
      .where('r.organization_id = :orgId', { orgId })
      .andWhere('r.id != :excludeRoleId', { excludeRoleId })
      .andWhere(
        'm.organization_id = :orgId AND m."isActive" = true AND m."isArchived" = false',
        { orgId },
      )
      .andWhere('p.code = :permissionCode', { permissionCode })
      .getCount();
  }

  private async replaceFieldPermissions(
    roleId: string,
    entries: RoleFieldPermissionEntryInput[],
    fieldRepo: Repository<RoleFieldPermission>,
  ): Promise<void> {
    for (const entry of entries) {
      if (!PROTECTED_FIELD_KEYS.has(`${entry.resource}.${entry.field}`)) {
        throw new BadRequestException(
          `Unknown protected field "${entry.resource}.${entry.field}"`,
        );
      }
    }

    await fieldRepo.delete({ roleId });
    if (entries.length === 0) return;

    const rows = entries.map((entry) =>
      fieldRepo.create({
        roleId,
        resource: entry.resource,
        field: entry.field,
        actions: entry.actions,
      }),
    );
    await fieldRepo.save(rows);
  }
}
