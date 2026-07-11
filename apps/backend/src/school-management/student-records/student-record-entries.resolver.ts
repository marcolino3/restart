import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { StudentRecordEntriesService } from './student-record-entries.service';
import { StudentRecordEntry } from './entities/student-record-entry.entity';
import { CreateStudentRecordEntryInput } from './dto/create-student-record-entry.input';
import { UpdateStudentRecordEntryInput } from './dto/update-student-record-entry.input';

@Resolver(() => StudentRecordEntry)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentRecordEntriesResolver {
  constructor(private readonly entries: StudentRecordEntriesService) {}

  @Query(() => [StudentRecordEntry], { name: 'studentRecordEntries' })
  @Permissions('STUDENT_RECORD_READ')
  findByStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.entries.findByStudent(studentId, orgId);
  }

  @Mutation(() => StudentRecordEntry)
  @Permissions('STUDENT_RECORD_WRITE')
  createStudentRecordEntry(
    @Args('input') input: CreateStudentRecordEntryInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.entries.create(input, orgId, membershipId);
  }

  @Mutation(() => StudentRecordEntry)
  @Permissions('STUDENT_RECORD_WRITE')
  updateStudentRecordEntry(
    @Args('input') input: UpdateStudentRecordEntryInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.entries.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('STUDENT_RECORD_DELETE')
  deleteStudentRecordEntry(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.entries.remove(id, orgId);
  }
}
