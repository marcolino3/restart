import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SchoolClassesService } from './school-classes.service';
import { SchoolClass } from './entities/school-class.entity';
import { CreateSchoolClassInput } from './dto/create-school-class.input';
import { UpdateSchoolClassInput } from './dto/update-school-class.input';
import { ReorderSchoolClassesInput } from './dto/reorder-school-classes.input';

@Resolver(() => SchoolClass)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class SchoolClassesResolver {
  constructor(private readonly schoolClassesService: SchoolClassesService) {}

  @Query(() => [SchoolClass], { name: 'schoolClassesByOrgId' })
  @Permissions('SCHOOL_CLASS_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.schoolClassesService.findAllByOrgId(orgId);
  }

  /**
   * Klassen, die der aufrufende User unterrichtet (oder alle, wenn
   * Admin/SuperAdmin). Wird von der Klassen-Heatmap-Auswahl
   * verwendet, damit Lehrer:innen nur ihre eigenen Klassen sehen.
   */
  @Query(() => [SchoolClass], { name: 'myTeachingSchoolClasses' })
  @Permissions('SCHOOL_CLASS_READ')
  findVisibleToUser(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.schoolClassesService.findVisibleToUser(
      orgId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
    );
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

  @Mutation(() => [SchoolClass])
  @Permissions('SCHOOL_CLASS_WRITE')
  reorderSchoolClasses(
    @Args('input') input: ReorderSchoolClassesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.schoolClassesService.reorder(input, orgId);
  }
}
