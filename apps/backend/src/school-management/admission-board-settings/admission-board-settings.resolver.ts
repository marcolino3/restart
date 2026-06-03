import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdmissionBoardSettingsService } from './admission-board-settings.service';
import { UpdateAdmissionBoardSettingsInput } from './dto/update-admission-board-settings.input';
import { AdmissionBoardSettings } from './entities/admission-board-settings.entity';

@Resolver(() => AdmissionBoardSettings)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionBoardSettingsResolver {
  constructor(private readonly service: AdmissionBoardSettingsService) {}

  @Query(() => AdmissionBoardSettings, { name: 'admissionBoardSettings' })
  @Permissions('ADMISSION_STAGE_READ')
  findForOrg(@CurrentOrgId() orgId: string) {
    return this.service.findForOrg(orgId);
  }

  @Mutation(() => AdmissionBoardSettings)
  @Permissions('ADMISSION_STAGE_MANAGE')
  updateAdmissionBoardSettings(
    @Args('input') input: UpdateAdmissionBoardSettingsInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.upsertTableColumns(input.tableColumns, orgId);
  }
}
