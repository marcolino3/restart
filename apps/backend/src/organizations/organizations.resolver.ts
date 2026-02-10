// src/organizations/organizations.resolver.ts
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UpdateOrganizationInput } from './dto/update-organization.input';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

@Resolver(() => Organization)
export class OrganizationsResolver {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * Nur Superadmin darf neue Orgs anlegen.
   */
  @Mutation(() => Organization, { name: 'createOrganization' })
  @UseGuards(GqlJwtAuthGuard, SuperAdminGuard)
  createOrganization() {
    return this.organizationsService.create();
  }

  /**
   * Orgs auflisten
   * - Superadmin: alle
   * - normaler User: nur eigene (ueber Memberships)
   */
  @Query(() => [Organization], { name: 'organizations' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  organizations(@CurrentUser() user: TokenPayload) {
    return this.organizationsService.findAllForUser(user);
  }

  /**
   * Eine Org lesen
   */
  @Query(() => Organization, { name: 'organization' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  organization(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.findOneForUser(id, user);
  }

  /**
   * Org updaten (orgId aus Input, da SuperAdmin editiert)
   */
  @Mutation(() => Organization, { name: 'updateOrganization' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  updateOrganization(
    @Args('updateOrganizationInput') input: UpdateOrganizationInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.updateForActiveOrg(input.id, input, user);
  }

  /**
   * Slug-Verfuegbarkeit pruefen
   */
  @Query(() => Boolean, { name: 'isOrganizationSlugAvailable' })
  @UseGuards(GqlJwtAuthGuard, SuperAdminGuard)
  isOrganizationSlugAvailable(
    @Args('slug', { type: () => String }) slug: string,
  ) {
    return this.organizationsService.isSlugAvailable(slug);
  }

  /**
   * Org entfernen (nur Owner/Superadmin)
   */
  @Mutation(() => Organization, { name: 'removeOrganization' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  removeOrganization(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.removeForActiveOrg(id, user);
  }
}
