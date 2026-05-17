import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateLessonRecordInput } from './dto/create-lesson-record.input';
import { CreateLessonRecordsBulkInput } from './dto/create-lesson-records-bulk.input';
import { LessonRecordsFilterInput } from './dto/lesson-records-filter.input';
import { UpdateLessonRecordInput } from './dto/update-lesson-record.input';
import { LessonRecord } from './entities/lesson-record.entity';
import { LessonRecordsService } from './lesson-records.service';

@Resolver(() => LessonRecord)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class LessonRecordsResolver {
  constructor(private readonly service: LessonRecordsService) {}

  @Query(() => [LessonRecord], { name: 'lessonRecords' })
  @Permissions('RECORD_KEEPING_READ')
  findAll(
    @Args('filter', { nullable: true }) filter: LessonRecordsFilterInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.find(filter ?? {}, orgId);
  }

  @Query(() => LessonRecord, { name: 'lessonRecord' })
  @Permissions('RECORD_KEEPING_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.findById(id, orgId);
  }

  @Query(() => LessonRecord, {
    name: 'currentLessonRecord',
    nullable: true,
  })
  @Permissions('RECORD_KEEPING_READ')
  current(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('lessonId', { type: () => ID }) lessonId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.findCurrent(studentId, lessonId, orgId);
  }

  @Mutation(() => LessonRecord)
  @Permissions('RECORD_KEEPING_WRITE')
  createLessonRecord(
    @Args('input') input: CreateLessonRecordInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.create(input, orgId, user.sub);
  }

  @Mutation(() => [LessonRecord])
  @Permissions('RECORD_KEEPING_WRITE')
  createLessonRecordsBulk(
    @Args('input') input: CreateLessonRecordsBulkInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.createBulk(input, orgId, user.sub);
  }

  @Mutation(() => LessonRecord)
  @Permissions('RECORD_KEEPING_WRITE')
  updateLessonRecord(
    @Args('input') input: UpdateLessonRecordInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('RECORD_KEEPING_WRITE')
  deleteLessonRecord(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.delete(id, orgId);
  }
}
