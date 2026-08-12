import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RoleFieldPermission } from './entities/role-field-permission.entity';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';
import { UpdateRolePermissionsInput } from './dto/update-role-permissions.input';
import { UpdateRoleMembersInput } from './dto/update-role-members.input';
import { UpdateRoleFieldPermissionsInput } from './dto/update-role-field-permissions.input';
import { DuplicateRoleInput } from './dto/duplicate-role.input';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { SuperAdminOnly } from '@/auth/decorators/super-admin.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

@Resolver(() => Role)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class RolesResolver {
  constructor(private readonly rolesService: RolesService) {}

  @Query(() => [Role], { name: 'rolesByOrgId' })
  rolesByOrgId(@CurrentOrgId() orgId: string) {
    return this.rolesService.findAllByOrgId(orgId);
  }

  @Query(() => [Role], { name: 'rolesByOrganizationId' })
  @SuperAdminOnly()
  rolesByOrganizationId(
    @Args('organizationId', { type: () => ID }) organizationId: string,
  ) {
    return this.rolesService.findAllByOrgId(organizationId);
  }

  @Query(() => [RoleFieldPermission], { name: 'roleFieldPermissions' })
  @Permissions('ROLE_ASSIGN')
  roleFieldPermissions(
    @Args('roleId', { type: () => ID }) roleId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.rolesService.findFieldPermissions(roleId, orgId);
  }

  @Mutation(() => Role)
  @Permissions('ROLE_CREATE')
  createRole(
    @Args('input') input: CreateRoleInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.rolesService.createRole(orgId, input, user.permissions ?? []);
  }

  @Mutation(() => Role)
  @Permissions('ROLE_CREATE')
  duplicateRole(
    @Args('input') input: DuplicateRoleInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.rolesService.duplicateRole(
      orgId,
      input.sourceRoleId,
      input.name,
      user.permissions ?? [],
    );
  }

  @Mutation(() => Role)
  @Permissions('ROLE_ASSIGN')
  updateRole(
    @Args('input') input: UpdateRoleInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.rolesService.updateRole(
      orgId,
      input,
      user.permissions ?? [],
      user.isSuperAdmin ?? false,
    );
  }

  @Mutation(() => Role)
  @Permissions('ROLE_ASSIGN')
  updateRolePermissions(
    @Args('input') input: UpdateRolePermissionsInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.rolesService.updateRolePermissions(
      input.roleId,
      input.permissionCodes,
      orgId,
      user.permissions ?? [],
      user.isSuperAdmin ?? false,
    );
  }

  @Mutation(() => Role)
  @Permissions('ROLE_ASSIGN')
  updateRoleFieldPermissions(
    @Args('input') input: UpdateRoleFieldPermissionsInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.rolesService.updateRoleFieldPermissions(
      orgId,
      input.roleId,
      input.fieldPermissions,
      user.fieldPermissions ?? new Map(),
      user.isSuperAdmin ?? false,
    );
  }

  @Mutation(() => Role)
  @Permissions('ROLE_ASSIGN')
  updateRoleMembers(
    @Args('input') input: UpdateRoleMembersInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.rolesService.updateRoleMembers(
      orgId,
      input.roleId,
      input.membershipIds,
    );
  }

  @Mutation(() => Boolean)
  @Permissions('ROLE_DELETE')
  deleteRole(
    @Args('roleId', { type: () => ID }) roleId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.rolesService.deleteRole(orgId, roleId);
  }
}
