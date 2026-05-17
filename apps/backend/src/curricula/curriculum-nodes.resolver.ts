import {
  Args,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { CurriculumNodesService } from './curriculum-nodes.service';
import { CreateCurriculumNodeInput } from './dto/create-curriculum-node.input';
import { ReorderCurriculumNodesInput } from './dto/reorder-curriculum-nodes.input';
import { SetLessonPrerequisitesInput } from './dto/set-lesson-prerequisites.input';
import { UpdateCurriculumNodeInput } from './dto/update-curriculum-node.input';
import { UpsertCurriculumNodeTranslationInput } from './dto/upsert-curriculum-node-translation.input';
import { CurriculumNodeTranslation } from './entities/curriculum-node-translation.entity';
import { CurriculumNode } from './entities/curriculum-node.entity';

@Resolver(() => CurriculumNode)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class CurriculumNodesResolver {
  constructor(private readonly service: CurriculumNodesService) {}

  @Query(() => [CurriculumNode], { name: 'curriculumNodes' })
  @Permissions('CURRICULUM_READ')
  findAll(
    @Args('curriculumId', { type: () => ID }) curriculumId: string,
    @Args('levelId', { type: () => ID }) levelId: string,
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.service.findByCurriculumAndLevel(
      curriculumId,
      levelId,
      orgId,
      includeArchived ?? false,
    );
  }

  @Query(() => CurriculumNode, { name: 'curriculumNodeById' })
  @Permissions('CURRICULUM_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.findOne(id, orgId);
  }

  @Query(() => [CurriculumNode], { name: 'lessonsByOrg' })
  @Permissions('CURRICULUM_READ')
  findAllLessons(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.service.findAllLessons(orgId, includeArchived ?? false);
  }

  @Mutation(() => CurriculumNode)
  @Permissions('CURRICULUM_MANAGE')
  createCurriculumNode(
    @Args('input') input: CreateCurriculumNodeInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.create(input, orgId);
  }

  @Mutation(() => CurriculumNode)
  @Permissions('CURRICULUM_MANAGE')
  updateCurriculumNode(
    @Args('input') input: UpdateCurriculumNodeInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('CURRICULUM_MANAGE')
  archiveCurriculumNode(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.archive(id, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('CURRICULUM_MANAGE')
  unarchiveCurriculumNode(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.unarchive(id, orgId);
  }

  @Mutation(() => [CurriculumNode])
  @Permissions('CURRICULUM_MANAGE')
  reorderCurriculumNodes(
    @Args('input') input: ReorderCurriculumNodesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.reorder(input, orgId);
  }

  @Mutation(() => CurriculumNodeTranslation)
  @Permissions('CURRICULUM_MANAGE')
  upsertCurriculumNodeTranslation(
    @Args('input') input: UpsertCurriculumNodeTranslationInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.upsertTranslation(input, orgId);
  }

  // ─── Prerequisites ──────────────────────────────────────────────

  @Query(() => [CurriculumNode], { name: 'lessonPrerequisites' })
  @Permissions('CURRICULUM_READ')
  lessonPrerequisites(
    @Args('lessonId', { type: () => ID }) lessonId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.getPrerequisites(lessonId, orgId);
  }

  @Mutation(() => CurriculumNode)
  @Permissions('CURRICULUM_MANAGE')
  setLessonPrerequisites(
    @Args('input') input: SetLessonPrerequisitesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.setLessonPrerequisites(input, orgId);
  }

  // ─── "Was kommt als naechstes" ─────────────────────────────────

  @Query(() => [CurriculumNode], { name: 'nextLessonsForStudent' })
  @Permissions('RECORD_KEEPING_READ')
  nextLessonsForStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @CurrentOrgId() orgId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    return this.service.getNextLessonsForStudent(studentId, orgId, limit ?? 20);
  }

  /**
   * Eltern-Chain von diesem Node bis zur Wurzel (AREA → TOPIC → GROUP → LESSON
   * → ancestors = [GROUP, TOPIC, AREA], geordnet vom nächsten Parent bis Root).
   * Praktisch fuer UI-Gruppierung (z.B. Lektionen nach AREA gruppieren).
   */
  @ResolveField(() => [CurriculumNode], { name: 'ancestors' })
  ancestors(
    @Parent() node: CurriculumNode,
    @CurrentOrgId() orgId: string,
  ): Promise<CurriculumNode[]> {
    return this.service.getAncestors(node.id, orgId);
  }
}
