// src/organizations/organizations.resolver.ts
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CreateOrganizationInput } from './dto/create-organization.input';
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
  createOrganization(
    @Args('createOrganizationInput') input: CreateOrganizationInput,
  ) {
    return this.organizationsService.create(input);
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
   * Org updaten (aktive Org aus Token)
   */
  @Mutation(() => Organization, { name: 'updateOrganization' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  updateOrganization(
    @Args('updateOrganizationInput') input: UpdateOrganizationInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationsService.updateForActiveOrg(
      user.orgId,
      input,
      user,
    );
  }

  /**
   * Org entfernen (nur Owner/Superadmin)
   */
  @Mutation(() => Organization, { name: 'removeOrganization' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  removeOrganization(@CurrentUser() user: TokenPayload) {
    return this.organizationsService.removeForActiveOrg(user.orgId, user);
  }
}
