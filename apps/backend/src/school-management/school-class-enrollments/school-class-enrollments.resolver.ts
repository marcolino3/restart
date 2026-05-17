import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { SchoolClassEnrollmentsService } from './school-class-enrollments.service';
import { SchoolClassEnrollment } from './entities/school-class-enrollment.entity';
import { CreateSchoolClassEnrollmentInput } from './dto/create-school-class-enrollment.input';
import { UpdateSchoolClassEnrollmentInput } from './dto/update-school-class-enrollment.input';

@Resolver(() => SchoolClassEnrollment)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class SchoolClassEnrollmentsResolver {
  constructor(
    private readonly enrollmentsService: SchoolClassEnrollmentsService,
  ) {}

  @Query(() => [SchoolClassEnrollment], { name: 'enrollmentsByStudentId' })
  @Permissions('SCHOOL_CLASS_READ')
  findByStudentId(
    @Args('studentId', { type: () => ID }) studentId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.enrollmentsService.findByStudentId(studentId, orgId);
  }

  @Query(() => [SchoolClassEnrollment], {
    name: 'activeEnrollmentsBySchoolClassId',
  })
  @Permissions('SCHOOL_CLASS_READ')
  findActiveBySchoolClassId(
    @Args('schoolClassId', { type: () => ID }) schoolClassId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.enrollmentsService.findActiveBySchoolClassId(
      schoolClassId,
      orgId,
    );
  }

  @Mutation(() => SchoolClassEnrollment)
  @Permissions('SCHOOL_CLASS_WRITE')
  createEnrollment(
    @Args('input') input: CreateSchoolClassEnrollmentInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.enrollmentsService.create(input, orgId);
  }

  @Mutation(() => SchoolClassEnrollment)
  @Permissions('SCHOOL_CLASS_WRITE')
  updateEnrollment(
    @Args('input') input: UpdateSchoolClassEnrollmentInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.enrollmentsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('SCHOOL_CLASS_DELETE')
  deleteEnrollment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.enrollmentsService.remove(id, orgId);
  }
}
