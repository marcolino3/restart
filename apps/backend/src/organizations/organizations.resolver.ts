// src/organizations/organizations.resolver.ts
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UpdateOrganizationInput } from './dto/update-organization.input';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { ChangeOrganizationPlanInput } from './dto/change-organization-plan.input';
import { SuspendOrganizationInput } from './dto/suspend-organization.input';
import { OrganizationsOverview } from './dto/organizations-overview.output';
import { OrganizationUsage } from './dto/organization-usage.output';
import { OrganizationAuditLogPage } from './dto/organization-audit-log-page.output';
import { ExportOrganizationDataResult } from './dto/export-organization-data.output';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';

// Fields on UpdateOrganizationInput that only a SuperAdmin may change —
// plan/billing and the suspension lifecycle. Stripped for org admins in
// updateOrganization below.
const SUPERADMIN_ONLY_ORG_FIELDS = [
  'plan',
  'userLicenseLimit',
  'contractEndsAt',
  'billingInterval',
  'billingAmountChf',
  'storageLimitGb',
  'lifecycleStatus',
  'trialEndsAt',
  'suspendedReason',
  'isActive',
  'isArchived',
  'isDeleted',
] as const satisfies readonly (keyof UpdateOrganizationInput)[];

@Resolver(() => Organization)
export class OrganizationsResolver {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Mutation(() => Organization, { name: 'createOrganization' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  createOrganization(@Args('input') input: CreateOrganizationInput) {
    return this.organizationsService.create(input);
  }

  @Query(() => [Organization], { name: 'organizations' })
  @UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
  organizations(@CurrentUser() user: TokenPayload) {
    return this.organizationsService.findAllForUser(user);
  }

  @Query(() => Organization, { name: 'organization' })
  @UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
  organization(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.findOneForUser(id, user);
  }

  @Mutation(() => Organization, { name: 'updateOrganization' })
  @Roles(SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN)
  @UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
  updateOrganization(
    @Args('updateOrganizationInput') input: UpdateOrganizationInput,
    @CurrentUser() user: TokenPayload,
  ) {
    // ORG_OWNER/ORG_ADMIN roles are not bound to a specific org — the target
    // must be the caller's active organization. Only SuperAdmin may update
    // arbitrary orgs. Masked as NotFound to avoid leaking org existence.
    if (!user.isSuperAdmin && input.id !== user.orgId) {
      throw new NotFoundException('Organization not found');
    }
    // Billing/lifecycle fields are SuperAdmin-only — an org admin must not be
    // able to upgrade their own plan or lift a suspension via this mutation.
    if (!user.isSuperAdmin) {
      for (const field of SUPERADMIN_ONLY_ORG_FIELDS) {
        delete input[field];
      }
    }
    return this.organizationsService.updateOrganization(input.id, input);
  }

  @Query(() => Boolean, { name: 'isOrganizationSubdomainAvailable' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  isOrganizationSubdomainAvailable(
    @Args('subdomain', { type: () => String }) subdomain: string,
  ) {
    return this.organizationsService.isSubdomainAvailable(subdomain);
  }

  @Query(() => Boolean, { name: 'isOrganizationDomainAvailable' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  isOrganizationDomainAvailable(
    @Args('domain', { type: () => String }) domain: string,
  ) {
    return this.organizationsService.isDomainAvailable(domain);
  }

  @Mutation(() => Organization, { name: 'removeOrganization' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  removeOrganization(@Args('id', { type: () => String }) id: string) {
    return this.organizationsService.removeOrganization(id);
  }

  @Query(() => OrganizationsOverview, { name: 'organizationsOverview' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  organizationsOverview() {
    return this.organizationsService.getOrganizationsOverview();
  }

  @Query(() => OrganizationUsage, { name: 'organizationUsage' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  organizationUsage(
    @Args('organizationId', { type: () => String }) organizationId: string,
  ) {
    return this.organizationsService.getOrganizationUsage(organizationId);
  }

  @Mutation(() => Organization, { name: 'suspendOrganization' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  suspendOrganization(
    @Args('input') input: SuspendOrganizationInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.suspendOrganization(
      input.id,
      input.reason,
      user.sub,
    );
  }

  @Mutation(() => Organization, { name: 'reactivateOrganization' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  reactivateOrganization(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.reactivateOrganization(id, user.sub);
  }

  @Mutation(() => Organization, { name: 'changeOrganizationPlan' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  changeOrganizationPlan(
    @Args('input') input: ChangeOrganizationPlanInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.changeOrganizationPlan(input, user.sub);
  }

  @Query(() => OrganizationAuditLogPage, { name: 'organizationAuditLog' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  organizationAuditLog(
    @Args('organizationId', { type: () => String }) organizationId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit = 25,
    @Args('offset', { type: () => Int, nullable: true }) offset = 0,
  ) {
    return this.organizationsService.getOrganizationAuditLog(
      organizationId,
      limit,
      offset,
    );
  }

  @Mutation(() => ExportOrganizationDataResult, {
    name: 'exportOrganizationData',
  })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  exportOrganizationData(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.exportOrganizationData(id, user.sub);
  }
}
