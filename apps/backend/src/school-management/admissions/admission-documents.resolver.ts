import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { AdmissionDocumentsService } from './admission-documents.service';
import { AdmissionDocument } from './entities/admission-document.entity';

@Resolver(() => AdmissionDocument)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionDocumentsResolver {
  constructor(private readonly documents: AdmissionDocumentsService) {}

  @Query(() => [AdmissionDocument], { name: 'admissionDocumentsByApplication' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findByApplication(
    @Args('applicationId', { type: () => ID }) applicationId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.documents.findByApplication(applicationId, orgId);
  }
}
