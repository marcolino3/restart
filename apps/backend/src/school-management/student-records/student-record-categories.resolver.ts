import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { StudentRecordCategoriesService } from './student-record-categories.service';
import { StudentRecordCategory } from './entities/student-record-category.entity';
import { CreateStudentRecordCategoryInput } from './dto/create-student-record-category.input';
import { UpdateStudentRecordCategoryInput } from './dto/update-student-record-category.input';
import { ReorderStudentRecordCategoriesInput } from './dto/reorder-student-record-categories.input';

@Resolver(() => StudentRecordCategory)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentRecordCategoriesResolver {
  constructor(
    private readonly categoriesService: StudentRecordCategoriesService,
  ) {}

  @Query(() => [StudentRecordCategory], { name: 'studentRecordCategories' })
  @Permissions('STUDENT_RECORD_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.categoriesService.findAllByOrgId(
      orgId,
      includeArchived ?? false,
    );
  }

  @Query(() => StudentRecordCategory, { name: 'studentRecordCategoryById' })
  @Permissions('STUDENT_RECORD_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.findOne(id, orgId);
  }

  @Mutation(() => StudentRecordCategory)
  @Permissions('STUDENT_RECORD_CATEGORY_WRITE')
  createStudentRecordCategory(
    @Args('input') input: CreateStudentRecordCategoryInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.create(input, orgId);
  }

  @Mutation(() => StudentRecordCategory)
  @Permissions('STUDENT_RECORD_CATEGORY_WRITE')
  updateStudentRecordCategory(
    @Args('input') input: UpdateStudentRecordCategoryInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('STUDENT_RECORD_CATEGORY_WRITE')
  archiveStudentRecordCategory(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.archive(id, orgId);
  }

  @Mutation(() => [StudentRecordCategory])
  @Permissions('STUDENT_RECORD_CATEGORY_WRITE')
  reorderStudentRecordCategories(
    @Args('input') input: ReorderStudentRecordCategoriesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.categoriesService.reorder(input.ids, orgId);
  }
}
