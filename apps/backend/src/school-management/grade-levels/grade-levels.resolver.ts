import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { GradeLevelsService } from './grade-levels.service';
import { GradeLevel } from './entities/grade-level.entity';
import { CreateGradeLevelInput } from './dto/create-grade-level.input';
import { UpdateGradeLevelInput } from './dto/update-grade-level.input';

@Resolver(() => GradeLevel)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class GradeLevelsResolver {
  constructor(private readonly gradeLevelsService: GradeLevelsService) {}

  @Query(() => [GradeLevel], { name: 'gradeLevelsByOrgId' })
  @Permissions('SCHOOL_CLASS_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.gradeLevelsService.findAllByOrgId(orgId);
  }

  @Query(() => GradeLevel, { name: 'gradeLevelById' })
  @Permissions('SCHOOL_CLASS_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.gradeLevelsService.findOne(id, orgId);
  }

  @Mutation(() => GradeLevel)
  @Permissions('SCHOOL_CLASS_WRITE')
  createGradeLevel(
    @Args('input') input: CreateGradeLevelInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.gradeLevelsService.create(input, orgId);
  }

  @Mutation(() => GradeLevel)
  @Permissions('SCHOOL_CLASS_WRITE')
  updateGradeLevel(
    @Args('input') input: UpdateGradeLevelInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.gradeLevelsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('SCHOOL_CLASS_DELETE')
  deleteGradeLevel(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.gradeLevelsService.remove(id, orgId);
  }
}
