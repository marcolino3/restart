import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StudentNote } from './entities/student-note.entity';
import { StudentNotesService } from './student-notes.service';
import { CreateStudentNoteInput } from './dto/create-student-note.input';
import { UpdateStudentNoteInput } from './dto/update-student-note.input';

@Resolver(() => StudentNote)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentNotesResolver {
  constructor(private readonly studentNotesService: StudentNotesService) {}

  @Mutation(() => StudentNote, { name: 'createStudentNote' })
  @Permissions('SCHOOL_CLASS_WRITE')
  createStudentNote(
    @Args('createStudentNoteInput') input: CreateStudentNoteInput,
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentNotesService.createNote(input, user.membershipId, orgId);
  }

  @Query(() => [StudentNote], { name: 'studentNotesByStudentId' })
  @Permissions('SCHOOL_CLASS_READ')
  findNotesByStudentId(
    @Args('studentId', { type: () => ID }) studentId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentNotesService.findNotesByStudentId(studentId, orgId);
  }

  @Mutation(() => StudentNote, { name: 'updateStudentNote' })
  @Permissions('SCHOOL_CLASS_WRITE')
  updateStudentNote(
    @Args('updateStudentNoteInput') input: UpdateStudentNoteInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentNotesService.updateNote(input, orgId);
  }

  @Mutation(() => StudentNote, { name: 'softDeleteStudentNote' })
  @Permissions('SCHOOL_CLASS_WRITE')
  softDeleteStudentNote(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentNotesService.softDeleteNote(id, orgId);
  }
}
