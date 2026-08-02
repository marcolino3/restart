import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StudentsService } from '@/school-management/students/students.service';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StudentNote } from './entities/student-note.entity';
import { StudentNotesService } from './student-notes.service';
import { CreateStudentNoteInput } from './dto/create-student-note.input';
import { UpdateStudentNoteInput } from './dto/update-student-note.input';

@Resolver(() => StudentNote)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentNotesResolver {
  constructor(
    private readonly studentNotesService: StudentNotesService,
    private readonly studentsService: StudentsService,
  ) {}

  @Mutation(() => StudentNote, { name: 'createStudentNote' })
  @Permissions('SCHOOL_CLASS_WRITE')
  async createStudentNote(
    @Args('createStudentNoteInput') input: CreateStudentNoteInput,
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      input.studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.studentNotesService.createNote(input, user.membershipId, orgId);
  }

  @Query(() => [StudentNote], { name: 'studentNotesByStudentId' })
  @Permissions('SCHOOL_CLASS_READ')
  async findNotesByStudentId(
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
    return this.studentNotesService.findNotesByStudentId(studentId, orgId);
  }

  @Mutation(() => StudentNote, { name: 'updateStudentNote' })
  @Permissions('SCHOOL_CLASS_WRITE')
  async updateStudentNote(
    @Args('updateStudentNoteInput') input: UpdateStudentNoteInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const studentId = await this.studentNotesService.getStudentIdForNote(
      input.id,
      orgId,
    );
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.studentNotesService.updateNote(input, orgId);
  }

  @Mutation(() => StudentNote, { name: 'softDeleteStudentNote' })
  @Permissions('SCHOOL_CLASS_WRITE')
  async softDeleteStudentNote(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const studentId = await this.studentNotesService.getStudentIdForNote(
      id,
      orgId,
    );
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.studentNotesService.softDeleteNote(id, orgId);
  }
}
