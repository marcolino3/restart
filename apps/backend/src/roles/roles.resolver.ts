import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { UpdateRolePermissionsInput } from './dto/update-role-permissions.input';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';

@Resolver(() => Role)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class RolesResolver {
  constructor(private readonly rolesService: RolesService) {}

  @Query(() => [Role], { name: 'rolesByOrgId' })
  rolesByOrgId(@CurrentOrgId() orgId: string) {
    return this.rolesService.findAllByOrgId(orgId);
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
