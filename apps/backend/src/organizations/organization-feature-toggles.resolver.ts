import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UpdateOrganizationFeatureToggleInput } from '@/organizations/dto/update-organization-feature-toggle.input';
import { OrganizationFeatureToggle } from '@/organizations/entities/organization-feature-toggle.entity';
import { OrganizationFeatureTogglesService } from '@/organizations/organization-feature-toggles.service';

@Resolver(() => OrganizationFeatureToggle)
export class OrganizationFeatureTogglesResolver {
  constructor(
    private readonly togglesService: OrganizationFeatureTogglesService,
  ) {}

  // SuperAdmin-only: feature toggles are an org-management concern, not
  // something org admins configure themselves.
  @Query(() => [OrganizationFeatureToggle], {
    name: 'organizationFeatureToggles',
  })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  organizationFeatureToggles(
    @Args('organizationId', { type: () => ID }) organizationId: string,
  ) {
    return this.togglesService.findAllForOrg(organizationId);
  }

  @Mutation(() => OrganizationFeatureToggle, {
    name: 'updateOrganizationFeatureToggle',
  })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  updateOrganizationFeatureToggle(
    @Args('input') input: UpdateOrganizationFeatureToggleInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.togglesService.setEnabled(
      input.organizationId,
      input.featureKey as never,
      input.enabled,
      user.sub,
    );
  }
}
