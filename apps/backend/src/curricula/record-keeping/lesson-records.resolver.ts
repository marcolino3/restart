import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StudentsService } from '@/school-management/students/students.service';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateLessonRecordInput } from './dto/create-lesson-record.input';
import { CreateLessonRecordsBulkInput } from './dto/create-lesson-records-bulk.input';
import { LessonRecordsFilterInput } from './dto/lesson-records-filter.input';
import { UpdateLessonRecordInput } from './dto/update-lesson-record.input';
import { StudentAttentionSummaryOutput } from './dto/attention-summary.output';
import { ClassroomHeatmapDataOutput } from './dto/classroom-heatmap.output';
import { LessonRecord } from './entities/lesson-record.entity';
import { LessonRecordsService } from './lesson-records.service';
import { RecordKeepingSettingsService } from './record-keeping-settings.service';

@Resolver(() => LessonRecord)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class LessonRecordsResolver {
  constructor(
    private readonly service: LessonRecordsService,
    private readonly studentsService: StudentsService,
    private readonly settingsService: RecordKeepingSettingsService,
  ) {}

  @Query(() => [StudentAttentionSummaryOutput], {
    name: 'classroomAttentionSummaries',
  })
  @Permissions('RECORD_KEEPING_READ')
  async classroomAttentionSummaries(
    @Args('schoolClassId', { type: () => ID }) schoolClassId: string,
    @Args('locale', { type: () => String, defaultValue: 'de' }) locale: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StudentAttentionSummaryOutput[]> {
    await this.studentsService.assertSchoolClassVisibleToUser(
      schoolClassId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    const settings = await this.settingsService.getForOrg(orgId);
    return this.service.getClassroomAttentionSummaries(
      schoolClassId,
      orgId,
      locale,
      {
        introducedStuckDays: settings.introducedStuckDays,
        practicedStuckDays: settings.practicedStuckDays,
        bigGapDays: settings.bigGapDays,
      },
    );
  }

  @Query(() => ClassroomHeatmapDataOutput, { name: 'classroomHeatmapData' })
  @Permissions('RECORD_KEEPING_READ')
  async classroomHeatmapData(
    @Args('schoolClassId', { type: () => ID }) schoolClassId: string,
    @Args('locale', { type: () => String, defaultValue: 'de' }) locale: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ClassroomHeatmapDataOutput> {
    await this.studentsService.assertSchoolClassVisibleToUser(
      schoolClassId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.service.getClassroomHeatmapData(schoolClassId, orgId, locale);
  }

  @Query(() => [LessonRecord], { name: 'lessonRecords' })
  @Permissions('RECORD_KEEPING_READ')
  async findAll(
    @Args('filter', { nullable: true }) filter: LessonRecordsFilterInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    // When the caller specifies a studentId, enforce row-level access
    // (same rules as the students-query scoping).
    if (filter?.studentId) {
      await this.studentsService.assertStudentVisibleToUser(
        filter.studentId,
        user.sub,
        user.roles ?? [],
        user.isSuperAdmin ?? false,
        orgId,
      );
    }
    // Same row-level guard for class-scoped queries — without this a
    // teacher could read another class's records by passing its id.
    if (filter?.schoolClassId) {
      await this.studentsService.assertSchoolClassVisibleToUser(
        filter.schoolClassId,
        user.sub,
        user.roles ?? [],
        user.isSuperAdmin ?? false,
        orgId,
      );
    }
    // Non-admin callers with no narrower filter are restricted to records
    // of students they can see (teacher of the enrolled class). Admins
    // and explicit student/class filters skip this guard — the calls
    // above have already validated those.
    const ADMIN_ROLES = new Set([
      'ORG_OWNER',
      'ORG_ADMIN',
      'HR_MANAGER',
      'OFFICE',
    ]);
    const isAdmin =
      (user.isSuperAdmin ?? false) ||
      (user.roles ?? []).some((r) => ADMIN_ROLES.has(r));
    const teacherUserId =
      !isAdmin && !filter?.studentId && !filter?.schoolClassId
        ? user.sub
        : null;
    return this.service.find(filter ?? {}, orgId, teacherUserId);
  }

  @Query(() => LessonRecord, { name: 'lessonRecord' })
  @Permissions('RECORD_KEEPING_READ')
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const record = await this.service.findById(id, orgId);
    await this.studentsService.assertStudentVisibleToUser(
      record.studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return record;
  }

  @Query(() => LessonRecord, {
    name: 'currentLessonRecord',
    nullable: true,
  })
  @Permissions('RECORD_KEEPING_READ')
  async current(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('lessonId', { type: () => ID }) lessonId: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.service.findCurrent(studentId, lessonId, orgId);
  }

  @Mutation(() => LessonRecord)
  @Permissions('RECORD_KEEPING_WRITE')
  async createLessonRecord(
    @Args('input') input: CreateLessonRecordInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.studentsService.assertStudentVisibleToUser(
      input.studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.service.create(input, orgId, user.sub);
  }

  @Mutation(() => [LessonRecord])
  @Permissions('RECORD_KEEPING_WRITE')
  async createLessonRecordsBulk(
    @Args('input') input: CreateLessonRecordsBulkInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    // Every targeted student must be visible to the caller.
    for (const sid of input.studentIds) {
      await this.studentsService.assertStudentVisibleToUser(
        sid,
        user.sub,
        user.roles ?? [],
        user.isSuperAdmin ?? false,
        orgId,
      );
    }
    return this.service.createBulk(input, orgId, user.sub);
  }

  @Mutation(() => LessonRecord)
  @Permissions('RECORD_KEEPING_WRITE')
  async updateLessonRecord(
    @Args('input') input: UpdateLessonRecordInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const existing = await this.service.findById(input.id, orgId);
    await this.studentsService.assertStudentVisibleToUser(
      existing.studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('RECORD_KEEPING_WRITE')
  async deleteLessonRecord(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const existing = await this.service.findById(id, orgId);
    await this.studentsService.assertStudentVisibleToUser(
      existing.studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.service.delete(id, orgId);
  }
}
