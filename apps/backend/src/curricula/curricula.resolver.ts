import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { CurriculaService } from './curricula.service';
import { CreateCurriculumInput } from './dto/create-curriculum.input';
import { UpdateCurriculumInput } from './dto/update-curriculum.input';
import { UpsertCurriculumTranslationInput } from './dto/upsert-curriculum-translation.input';
import { CurriculumTranslation } from './entities/curriculum-translation.entity';
import { Curriculum } from './entities/curriculum.entity';

@Resolver(() => Curriculum)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class CurriculaResolver {
  constructor(private readonly service: CurriculaService) {}

  @Query(() => [Curriculum], { name: 'curricula' })
  @Permissions('CURRICULUM_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.service.findAllByOrgId(orgId, includeArchived ?? false);
  }

  @Query(() => Curriculum, { name: 'curriculumById' })
  @Permissions('CURRICULUM_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.findOne(id, orgId);
  }

  @Mutation(() => Curriculum)
  @Permissions('CURRICULUM_MANAGE')
  createCurriculum(
    @Args('input') input: CreateCurriculumInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.create(input, orgId);
  }

  @Mutation(() => Curriculum)
  @Permissions('CURRICULUM_MANAGE')
  updateCurriculum(
    @Args('input') input: UpdateCurriculumInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('CURRICULUM_MANAGE')
  archiveCurriculum(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.archive(id, orgId);
  }

  @Mutation(() => Curriculum)
  @Permissions('CURRICULUM_MANAGE')
  unarchiveCurriculum(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.unarchive(id, orgId);
  }

  @Mutation(() => [Curriculum])
  @Permissions('CURRICULUM_MANAGE')
  reorderCurricula(
    @Args('ids', { type: () => [ID] }) ids: string[],
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.reorder(ids, orgId);
  }

  @Mutation(() => CurriculumTranslation)
  @Permissions('CURRICULUM_MANAGE')
  upsertCurriculumTranslation(
    @Args('input') input: UpsertCurriculumTranslationInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.upsertTranslation(input, orgId);
  }
}
