import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';

@Resolver(() => Student)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentsResolver {
  constructor(private readonly studentsService: StudentsService) {}

  @Query(() => [Student], { name: 'studentsByOrgId' })
  @Permissions('SCHOOL_CLASS_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.studentsService.findVisibleByUser(
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
  }

  @Query(() => Student, { name: 'studentById' })
  @Permissions('SCHOOL_CLASS_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentsService.findOne(id, orgId);
  }

  @Mutation(() => Student)
  @Permissions('SCHOOL_CLASS_WRITE')
  createStudent(
    @Args('input') input: CreateStudentInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentsService.create(input, orgId);
  }

  @Mutation(() => Student)
  @Permissions('SCHOOL_CLASS_WRITE')
  updateStudent(
    @Args('input') input: UpdateStudentInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('SCHOOL_CLASS_DELETE')
  deleteStudent(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentsService.remove(id, orgId);
  }

  @Mutation(() => Student)
  @Permissions('SCHOOL_CLASS_WRITE')
  moveStudentToStage(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('stageId', { type: () => ID }) stageId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.studentsService.moveToStage(studentId, stageId, orgId);
  }
}
