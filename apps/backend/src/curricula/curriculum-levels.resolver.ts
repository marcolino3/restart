import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { CurriculumLevelsService } from './curriculum-levels.service';
import { CreateCurriculumLevelInput } from './dto/create-curriculum-level.input';
import { UpdateCurriculumLevelInput } from './dto/update-curriculum-level.input';
import { UpsertCurriculumLevelTranslationInput } from './dto/upsert-curriculum-level-translation.input';
import { CurriculumLevelTranslation } from './entities/curriculum-level-translation.entity';
import { CurriculumLevel } from './entities/curriculum-level.entity';

@Resolver(() => CurriculumLevel)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class CurriculumLevelsResolver {
  constructor(private readonly service: CurriculumLevelsService) {}

  @Query(() => [CurriculumLevel], { name: 'curriculumLevels' })
  @Permissions('CURRICULUM_LEVEL_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.service.findAllByOrgId(orgId, includeArchived ?? false);
  }

  @Query(() => CurriculumLevel, { name: 'curriculumLevelById' })
  @Permissions('CURRICULUM_LEVEL_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.findOne(id, orgId);
  }

  @Mutation(() => CurriculumLevel)
  @Permissions('CURRICULUM_LEVEL_MANAGE')
  createCurriculumLevel(
    @Args('input') input: CreateCurriculumLevelInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.create(input, orgId);
  }

  @Mutation(() => CurriculumLevel)
  @Permissions('CURRICULUM_LEVEL_MANAGE')
  updateCurriculumLevel(
    @Args('input') input: UpdateCurriculumLevelInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('CURRICULUM_LEVEL_MANAGE')
  archiveCurriculumLevel(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.archive(id, orgId);
  }

  @Mutation(() => [CurriculumLevel])
  @Permissions('CURRICULUM_LEVEL_MANAGE')
  reorderCurriculumLevels(
    @Args('ids', { type: () => [ID] }) ids: string[],
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.reorder(ids, orgId);
  }

  @Mutation(() => CurriculumLevelTranslation)
  @Permissions('CURRICULUM_LEVEL_MANAGE')
  upsertCurriculumLevelTranslation(
    @Args('input') input: UpsertCurriculumLevelTranslationInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.upsertTranslation(input, orgId);
  }
}
