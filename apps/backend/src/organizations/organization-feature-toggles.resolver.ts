import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UpdateOrganizationFeatureToggleInput } from '@/organizations/dto/update-organization-feature-toggle.input';
import { BulkUpdateOrganizationFeatureTogglesInput } from '@/organizations/dto/bulk-update-organization-feature-toggles.input';
import { OrganizationFeatureToggle } from '@/organizations/entities/organization-feature-toggle.entity';
import { OrganizationFeatureTogglesService } from '@/organizations/organization-feature-toggles.service';
import type { OrgFeatureKey } from '@restart/shared-schemas/org-features/feature-catalog';

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

  // Returns all rows affected by this change — disabling a parent feature
  // also disables and persists its dependents, so the client needs the
  // full set to update its cache, not just the toggled key.
  @Mutation(() => [OrganizationFeatureToggle], {
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

  // One request instead of N for bulk chips (Kernmodule / Alles / Ohne
  // Beta). Returns all rows affected across every update, same reasoning
  // as the single-toggle mutation above.
  @Mutation(() => [OrganizationFeatureToggle], {
    name: 'bulkUpdateOrganizationFeatureToggles',
  })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  bulkUpdateOrganizationFeatureToggles(
    @Args('input') input: BulkUpdateOrganizationFeatureTogglesInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.togglesService.bulkSetEnabled(
      input.organizationId,
      input.updates.map((u) => ({
        featureKey: u.featureKey as OrgFeatureKey,
        enabled: u.enabled,
      })),
      user.sub,
    );
  }
}
