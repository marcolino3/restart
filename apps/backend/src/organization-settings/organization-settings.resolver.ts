import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { OrganizationSettingsService } from './organization-settings.service';
import { OrganizationSettingOutput } from './dto/organization-setting.output';
import { CreateOrganizationSettingInput } from './dto/create-organization-setting.input';
import { UpdateOrganizationSettingInput } from './dto/update-organization-setting.input';

import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

@Resolver(() => OrganizationSettingOutput)
export class OrganizationSettingsResolver {
  constructor(
    private readonly organizationSettingsService: OrganizationSettingsService,
  ) {}

  /**
   * Get all settings for an organization (values are hidden)
   */
  @Query(() => [OrganizationSettingOutput], { name: 'organizationSettings' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  findAll(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationSettingsService.findAllForOrg(organizationId, user);
  }

  /**
   * Get a single setting, optionally with decrypted value
   */
  @Query(() => OrganizationSettingOutput, { name: 'organizationSetting' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  findOne(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('key') key: string,
    @Args('decrypt', { type: () => Boolean, defaultValue: false })
    decrypt: boolean,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationSettingsService.findOne(
      organizationId,
      key,
      user,
      decrypt,
    );
  }

  /**
   * Create a new organization setting
   */
  @Mutation(() => OrganizationSettingOutput, {
    name: 'createOrganizationSetting',
  })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  create(
    @Args('input') input: CreateOrganizationSettingInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationSettingsService.create(input, user);
  }

  /**
   * Update an existing setting
   */
  @Mutation(() => OrganizationSettingOutput, {
    name: 'updateOrganizationSetting',
  })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  update(
    @Args('input') input: UpdateOrganizationSettingInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationSettingsService.update(input, user);
  }

  /**
   * Delete a setting
   */
  @Mutation(() => Boolean, { name: 'deleteOrganizationSetting' })
  @UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
  remove(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('key') key: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.organizationSettingsService.remove(organizationId, key, user);
  }
}
