import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StudentsService } from '@/school-management/students/students.service';
import { StudentRecordDocumentsService } from './student-record-documents.service';
import { StudentRecordDocument } from './entities/student-record-document.entity';

@Resolver(() => StudentRecordDocument)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentRecordDocumentsResolver {
  constructor(
    private readonly documents: StudentRecordDocumentsService,
    private readonly studentsService: StudentsService,
  ) {}

  @Query(() => [StudentRecordDocument], {
    name: 'studentRecordDocumentsByEntry',
  })
  @Permissions('STUDENT_RECORD_READ')
  async findByEntry(
    @Args('entryId', { type: () => ID }) entryId: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const studentId = await this.documents.getStudentIdForEntry(entryId, orgId);
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.documents.findByEntry(entryId, orgId);
  }
}
