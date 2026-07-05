import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { DataSubjectType } from '@/data-requests/enums/data-subject-type.enum';
import { DataExportService } from './data-export.service';

@Resolver()
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class DataExportResolver {
  constructor(private readonly exportService: DataExportService) {}

  /**
   * Machine-readable export of all data held about a subject (Art. 15/20),
   * returned as a pretty-printed JSON string for download. Gated by the
   * permission that fulfils data-subject requests.
   */
  @Query(() => String, { name: 'dataSubjectExport' })
  @Permissions('DATA_REQUEST_MANAGE')
  async export(
    @Args('subjectType', { type: () => DataSubjectType })
    subjectType: DataSubjectType,
    @Args('subjectId', { type: () => ID }) subjectId: string,
    @CurrentOrgId() orgId: string,
  ): Promise<string> {
    const bundle = await this.exportService.export(
      subjectType,
      subjectId,
      orgId,
    );
    return JSON.stringify(bundle, null, 2);
  }
}
