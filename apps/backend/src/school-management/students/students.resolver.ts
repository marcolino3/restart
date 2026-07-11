import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';
import { StudentEnrollmentLoaders } from './loaders/student-enrollment-loaders';

@Resolver(() => Student)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentsResolver {
  constructor(private readonly studentsService: StudentsService) {}

  @Query(() => [Student], { name: 'studentsByOrgId' })
  @Permissions('STUDENT_READ')
  findAll(@CurrentOrgId() orgId: string, @CurrentUser() user: TokenPayload) {
    return this.studentsService.findVisibleByUser(
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
  }

  @Query(() => Student, { name: 'studentById' })
  @Permissions('STUDENT_READ')
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      id,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.studentsService.findOne(id, orgId);
  }

  @Mutation(() => Student)
  @Permissions('STUDENT_WRITE')
  createStudent(
    @Args('input') input: CreateStudentInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentsService.create(input, orgId);
  }

  @Mutation(() => Student)
  @Permissions('STUDENT_WRITE')
  async updateStudent(
    @Args('input') input: UpdateStudentInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      input.id,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.studentsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('STUDENT_DELETE')
  async deleteStudent(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      id,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.studentsService.remove(id, orgId);
  }

  @Mutation(() => Student)
  @Permissions('STUDENT_WRITE')
  async moveStudentToStage(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('stageId', { type: () => ID }) stageId: string,
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
    return this.studentsService.moveToStage(studentId, stageId, orgId);
  }

  /**
   * Aktuelle (aktive) Klasse eines Schülers — für die Klasse-/Stufe-Spalten der
   * Schülerliste. Per-Request via DataLoader gebatcht (eine Query je Request
   * statt N+1), org-scoped über den nach orgId gekeyten Loader.
   */
  @ResolveField(() => SchoolClass, { name: 'currentClass', nullable: true })
  currentClass(
    @Parent() student: Student,
    @CurrentOrgId() orgId: string,
    @Context()
    ctx: { loaders: { studentEnrollments: StudentEnrollmentLoaders } },
  ): Promise<SchoolClass | null> {
    return ctx.loaders.studentEnrollments
      .currentClassLoader(orgId)
      .load(student.id);
  }
}
