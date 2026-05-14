// src/organizations/organizations.resolver.ts
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UpdateOrganizationInput } from './dto/update-organization.input';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';

@Resolver(() => Organization)
export class OrganizationsResolver {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Mutation(() => Organization, { name: 'createOrganization' })
  @UseGuards(GqlBetterAuthGuard, SuperAdminGuard)
  createOrganization() {
    return this.organizationsService.create();
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
  ) {
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
}
