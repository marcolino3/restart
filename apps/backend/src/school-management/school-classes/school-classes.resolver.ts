import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { SchoolClassesService } from './school-classes.service';
import { SchoolClass } from './entities/school-class.entity';
import { CreateSchoolClassInput } from './dto/create-school-class.input';
import { UpdateSchoolClassInput } from './dto/update-school-class.input';

@Resolver(() => SchoolClass)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class SchoolClassesResolver {
  constructor(private readonly schoolClassesService: SchoolClassesService) {}

  @Query(() => [SchoolClass], { name: 'schoolClassesByOrgId' })
  @Permissions('SCHOOL_CLASS_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.schoolClassesService.findAllByOrgId(orgId);
  }

  @Query(() => SchoolClass, { name: 'schoolClassById' })
  @Permissions('SCHOOL_CLASS_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.schoolClassesService.findOne(id, orgId);
  }

  @Mutation(() => SchoolClass)
  @Permissions('SCHOOL_CLASS_WRITE')
  createSchoolClass(
    @Args('input') input: CreateSchoolClassInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.schoolClassesService.create(input, orgId);
  }

  @Mutation(() => SchoolClass)
  @Permissions('SCHOOL_CLASS_WRITE')
  updateSchoolClass(
    @Args('input') input: UpdateSchoolClassInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.schoolClassesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('SCHOOL_CLASS_DELETE')
  deleteSchoolClass(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.schoolClassesService.remove(id, orgId);
  }
}
