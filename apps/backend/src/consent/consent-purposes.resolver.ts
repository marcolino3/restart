import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { ConsentPurposesService } from './consent-purposes.service';
import { ConsentPurpose } from './entities/consent-purpose.entity';
import { CreateConsentPurposeInput } from './dto/create-consent-purpose.input';
import { UpdateConsentPurposeInput } from './dto/update-consent-purpose.input';
import { ReorderConsentPurposesInput } from './dto/reorder-consent-purposes.input';

@Resolver(() => ConsentPurpose)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ConsentPurposesResolver {
  constructor(private readonly purposesService: ConsentPurposesService) {}

  @Query(() => [ConsentPurpose], { name: 'consentPurposes' })
  @Permissions('CONSENT_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.purposesService.findAllByOrgId(orgId, includeArchived ?? false);
  }

  @Query(() => ConsentPurpose, { name: 'consentPurposeById' })
  @Permissions('CONSENT_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.purposesService.findOne(id, orgId);
  }

  @Mutation(() => ConsentPurpose)
  @Permissions('CONSENT_SETTINGS_MANAGE')
  createConsentPurpose(
    @Args('input') input: CreateConsentPurposeInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.purposesService.create(input, orgId);
  }

  @Mutation(() => ConsentPurpose)
  @Permissions('CONSENT_SETTINGS_MANAGE')
  updateConsentPurpose(
    @Args('input') input: UpdateConsentPurposeInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.purposesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('CONSENT_SETTINGS_MANAGE')
  archiveConsentPurpose(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.purposesService.archive(id, orgId);
  }

  @Mutation(() => [ConsentPurpose])
  @Permissions('CONSENT_SETTINGS_MANAGE')
  reorderConsentPurposes(
    @Args('input') input: ReorderConsentPurposesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.purposesService.reorder(input.ids, orgId);
  }
}
