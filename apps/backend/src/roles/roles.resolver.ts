import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { UpdateRolePermissionsInput } from './dto/update-role-permissions.input';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { SuperAdminOnly } from '@/auth/decorators/super-admin.decorator';

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

  @Mutation(() => Role)
  @Permissions('ROLE_ASSIGN')
  updateRolePermissions(
    @Args('input') input: UpdateRolePermissionsInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.rolesService.updateRolePermissions(
      input.roleId,
      input.permissionCodes,
      orgId,
    );
  }
}
