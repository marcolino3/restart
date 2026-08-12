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
  ): Promise<Role> {
    if (!orgId) throw new ForbiddenException('No active organization');
    let permissionCodes = input.permissionCodes ?? [];
    let fieldPermissions: RoleFieldPermissionEntryInput[] = [];

    if (input.duplicateFromRoleId) {
      const source = await this.findOne(input.duplicateFromRoleId, orgId);
      permissionCodes = (source.permissions ?? []).map((p) => p.code);
      const sourceFieldPermissions = await this.roleFieldPermissionRepo.find({
        where: { roleId: source.id },
      });
      fieldPermissions = sourceFieldPermissions.map((fp) => ({
        resource: fp.resource,
        field: fp.field,
        actions: fp.actions,
      }));
    }

    this.assertNoEscalation(actorPermissions, permissionCodes);

    const permissions =
      await this.permissionsService.findByCodes(permissionCodes);

    const role = this.roleRepo.create({
      organizationId: orgId,
      name: input.name,
      description: input.description ?? null,
      systemCode: null,
      isSystem: false,
      permissions,
    });
    const saved = await this.roleRepo.save(role);

    if (fieldPermissions.length > 0) {
      await this.replaceFieldPermissions(saved.id, fieldPermissions);
    }

    if (input.membershipIds?.length) {
      await this.assignMembers(orgId, saved.id, input.membershipIds);
    }

    return this.findOne(saved.id, orgId);
  }

  async assignMembers(
    orgId: string,
    roleId: string,
    membershipIds: string[],
  ): Promise<void> {
    const memberships = await this.membershipRepo.find({
      where: { id: In(membershipIds), organizationId: orgId },
      relations: ['roles'],
    });
    if (memberships.length !== membershipIds.length) {
      throw new NotFoundException('One or more memberships not found');
    }

    for (const membership of memberships) {
      const existingIds = new Set((membership.roles ?? []).map((r) => r.id));
      if (!existingIds.has(roleId)) {
        membership.roles = [
          ...(membership.roles ?? []),
          { id: roleId } as Role,
        ];
      }
    }
    await this.membershipRepo.save(memberships);
  }

  async updateRoleMembers(
    orgId: string,
    roleId: string,
    membershipIds: string[],
  ): Promise<Role> {
    const role = await this.findOne(roleId, orgId);

    const memberships = await this.membershipRepo.find({
      where: { id: In(membershipIds), organizationId: orgId },
      relations: ['roles'],
    });
    if (memberships.length !== membershipIds.length) {
      throw new NotFoundException('One or more memberships not found');
    }

    const targetIds = new Set(membershipIds);
    const currentMembers = await this.membershipRepo.find({
      where: { organizationId: orgId },
      relations: ['roles'],
    });

    const toUpdate: Membership[] = [];
    for (const membership of currentMembers) {
      const hasRole = (membership.roles ?? []).some((r) => r.id === roleId);
      const shouldHaveRole = targetIds.has(membership.id);
      if (hasRole === shouldHaveRole) continue;

      membership.roles = shouldHaveRole
        ? [...(membership.roles ?? []), { id: roleId } as Role]
        : (membership.roles ?? []).filter((r) => r.id !== roleId);
      toUpdate.push(membership);
    }

    if (toUpdate.length > 0) {
      await this.membershipRepo.save(toUpdate);
    }

    return this.findOne(role.id, orgId);
  }

  async duplicateRole(
    orgId: string,
    sourceRoleId: string,
    name: string,
    actorPermissions: string[],
  ): Promise<Role> {
    return this.createRole(
      orgId,
      { name, duplicateFromRoleId: sourceRoleId },
      actorPermissions,
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
    const role = await this.findOne(input.id, orgId);
    this.assertSystemRoleIdentityUnchanged(role, input);

    if (input.permissionCodes) {
      if (!actorIsSuperAdmin) {
        this.assertNoEscalation(actorPermissions, input.permissionCodes);
      }
      await this.assertNotStrippingLastOwnerRole(
        orgId,
        role,
        input.permissionCodes,
      );
      role.permissions = await this.permissionsService.findByCodes(
        input.permissionCodes,
      );
    }
    if (input.name !== undefined) role.name = input.name;
    if (input.description !== undefined) role.description = input.description;

    return this.roleRepo.save(role);
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
    // Multi-tenant guard: throws when the role does not belong to this org.
    await this.findOne(roleId, orgId);
    if (!actorIsSuperAdmin) {
      this.assertNoFieldEscalation(actorFieldPermissions, entries);
    }

    await this.replaceFieldPermissions(roleId, entries);
    return this.findOne(roleId, orgId);
  }

  async deleteRole(orgId: string, roleId: string): Promise<boolean> {
    const role = await this.findOne(roleId, orgId);
    this.assertSystemRoleNotDeleted(role);
    await this.assertNotDeletingLastOwnerRole(orgId, role);

    await this.roleRepo.remove(role);
    return true;
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
  ): Promise<void> {
    const grantsOwnerTransfer = (role.permissions ?? []).some(
      (p) => p.code === LAST_OWNER_GUARD_PERMISSION,
    );
    if (!grantsOwnerTransfer) return;

    const otherOwnerRoleCount = await this.countRolesWithPermission(
      orgId,
      LAST_OWNER_GUARD_PERMISSION,
      role.id,
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
  ): Promise<number> {
    return this.roleRepo
      .createQueryBuilder('r')
      .innerJoin('r.permissions', 'p')
      .where('r.organization_id = :orgId', { orgId })
      .andWhere('r.id != :excludeRoleId', { excludeRoleId })
      .andWhere('p.code = :permissionCode', { permissionCode })
      .getCount();
  }

  private async replaceFieldPermissions(
    roleId: string,
    entries: RoleFieldPermissionEntryInput[],
  ): Promise<void> {
    for (const entry of entries) {
      if (!PROTECTED_FIELD_KEYS.has(`${entry.resource}.${entry.field}`)) {
        throw new BadRequestException(
          `Unknown protected field "${entry.resource}.${entry.field}"`,
        );
      }
    }

    await this.roleFieldPermissionRepo.delete({ roleId });
    if (entries.length === 0) return;

    const rows = entries.map((entry) =>
      this.roleFieldPermissionRepo.create({
        roleId,
        resource: entry.resource,
        field: entry.field,
        actions: entry.actions,
      }),
    );
    await this.roleFieldPermissionRepo.save(rows);
  }
}
