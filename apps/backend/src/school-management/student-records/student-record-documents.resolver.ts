import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { StudentRecordDocumentsService } from './student-record-documents.service';
import { StudentRecordDocument } from './entities/student-record-document.entity';

@Resolver(() => StudentRecordDocument)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentRecordDocumentsResolver {
  constructor(private readonly documents: StudentRecordDocumentsService) {}

  @Query(() => [StudentRecordDocument], {
    name: 'studentRecordDocumentsByEntry',
  })
  @Permissions('STUDENT_RECORD_READ')
  findByEntry(
    @Args('entryId', { type: () => ID }) entryId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.documents.findByEntry(entryId, orgId);
  }
}
