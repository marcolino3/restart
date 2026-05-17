import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';

import { RecordKeepingSettings } from './entities/record-keeping-settings.entity';
import { UpdateRecordKeepingSettingsInput } from './dto/update-record-keeping-settings.input';
import { RecordKeepingSettingsService } from './record-keeping-settings.service';

@Resolver(() => RecordKeepingSettings)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class RecordKeepingSettingsResolver {
  constructor(private readonly service: RecordKeepingSettingsService) {}

  @Query(() => RecordKeepingSettings, { name: 'recordKeepingSettings' })
  @Permissions('RECORD_KEEPING_READ')
  async get(@CurrentOrgId() orgId: string) {
    return this.service.getForOrg(orgId);
  }

  @Mutation(() => RecordKeepingSettings)
  @Permissions('RECORD_KEEPING_SETTINGS_MANAGE')
  async updateRecordKeepingSettings(
    @Args('input') input: UpdateRecordKeepingSettingsInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.upsertForOrg(orgId, input);
  }
}
