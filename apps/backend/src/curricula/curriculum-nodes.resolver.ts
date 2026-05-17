import {
  Args,
  Context,
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
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StudentsService } from '@/school-management/students/students.service';
import { CurriculumNodesService } from './curriculum-nodes.service';
import { CurriculumNodeLoaders } from './loaders/curriculum-node-loaders';
import { CreateCurriculumNodeInput } from './dto/create-curriculum-node.input';
import { ReorderCurriculumNodesInput } from './dto/reorder-curriculum-nodes.input';
import { SetLessonPrerequisitesInput } from './dto/set-lesson-prerequisites.input';
import { UpdateCurriculumNodeInput } from './dto/update-curriculum-node.input';
import { UpsertCurriculumNodeTranslationInput } from './dto/upsert-curriculum-node-translation.input';
import { CurriculumNodeTranslation } from './entities/curriculum-node-translation.entity';
import { CurriculumNode } from './entities/curriculum-node.entity';
import { AreaLessonCount } from './dto/area-lesson-count.output';

@Resolver(() => CurriculumNode)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class CurriculumNodesResolver {
  constructor(
    private readonly service: CurriculumNodesService,
    private readonly studentsService: StudentsService,
  ) {}

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

  @Query(() => [CurriculumNode], { name: 'areasByOrg' })
  @Permissions('CURRICULUM_READ')
  findAllAreas(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.service.findAllAreas(orgId, includeArchived ?? false);
  }

  @Query(() => [AreaLessonCount], { name: 'areaLessonCountsByOrg' })
  @Permissions('CURRICULUM_READ')
  areaLessonCountsByOrg(@CurrentOrgId() orgId: string) {
    return this.service.findAreaLessonCounts(orgId);
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
  async nextLessonsForStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.service.getNextLessonsForStudent(studentId, orgId, limit ?? 20);
  }

  /**
   * Eltern-Chain von diesem Node bis zur Wurzel (AREA → TOPIC → GROUP → LESSON
   * → ancestors = [GROUP, TOPIC, AREA], geordnet vom nächsten Parent bis Root).
   * Praktisch fuer UI-Gruppierung (z.B. Lektionen nach AREA gruppieren).
   *
   * Batches per-request via DataLoader: ein Recursive-CTE pro Request statt
   * O(nodes * depth) Einzel-Queries.
   */
  @ResolveField(() => [CurriculumNode], { name: 'ancestors' })
  ancestors(
    @Parent() node: CurriculumNode,
    @CurrentOrgId() orgId: string,
    @Context() ctx: { loaders: { curriculumNodes: CurriculumNodeLoaders } },
  ): Promise<CurriculumNode[]> {
    return ctx.loaders.curriculumNodes.ancestorsLoader(orgId).load(node.id);
  }
}
