import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StudentsService } from '@/school-management/students/students.service';
import { StudentRecordEntriesService } from './student-record-entries.service';
import { StudentRecordEntry } from './entities/student-record-entry.entity';
import { CreateStudentRecordEntryInput } from './dto/create-student-record-entry.input';
import { UpdateStudentRecordEntryInput } from './dto/update-student-record-entry.input';

@Resolver(() => StudentRecordEntry)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentRecordEntriesResolver {
  constructor(
    private readonly entries: StudentRecordEntriesService,
    private readonly studentsService: StudentsService,
  ) {}

  @Query(() => [StudentRecordEntry], { name: 'studentRecordEntries' })
  @Permissions('STUDENT_RECORD_READ')
  async findByStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.entries.findByStudent(studentId, orgId);
  }

  @Mutation(() => StudentRecordEntry)
  @Permissions('STUDENT_RECORD_WRITE')
  async createStudentRecordEntry(
    @Args('input') input: CreateStudentRecordEntryInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      input.studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.entries.create(input, orgId, membershipId);
  }

  @Mutation(() => StudentRecordEntry)
  @Permissions('STUDENT_RECORD_WRITE')
  async updateStudentRecordEntry(
    @Args('input') input: UpdateStudentRecordEntryInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const studentId = await this.entries.getStudentIdForEntry(input.id, orgId);
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.entries.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('STUDENT_RECORD_DELETE')
  async deleteStudentRecordEntry(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const studentId = await this.entries.getStudentIdForEntry(id, orgId);
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.entries.remove(id, orgId);
  }
}
