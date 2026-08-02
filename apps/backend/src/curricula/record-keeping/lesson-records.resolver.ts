import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StudentsService } from '@/school-management/students/students.service';
import { UseGuards } from '@nestjs/common';
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
import { CreateLessonRecordInput } from './dto/create-lesson-record.input';
import { CreateLessonRecordsBulkInput } from './dto/create-lesson-records-bulk.input';
import { LessonRecordsFilterInput } from './dto/lesson-records-filter.input';
import { UpdateLessonRecordInput } from './dto/update-lesson-record.input';
import { UpdateLessonRecordsGroupInput } from './dto/update-lesson-records-group.input';
import { StudentAttentionSummaryOutput } from './dto/attention-summary.output';
import { ClassroomHeatmapDataOutput } from './dto/classroom-heatmap.output';
import {
  EngagementTimelineOutput,
  StudentTimelineOutput,
  TimelineGranularity,
} from './dto/timeline.output';
import { RecentLessonRecordOutput } from './dto/recent-lesson-record.output';
import { MyLessonRecordStatsOutput } from './dto/my-lesson-record-stats.output';
import { LessonRecordAttachment } from './entities/lesson-record-attachment.entity';
import { LessonRecord } from './entities/lesson-record.entity';
import { LessonRecordAttachmentsService } from './lesson-record-attachments.service';
import {
  DEFAULT_RECENT_LIMIT,
  LessonRecordsService,
} from './lesson-records.service';
import { RecordKeepingSettingsService } from './record-keeping-settings.service';

@Resolver(() => LessonRecord)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class LessonRecordsResolver {
  constructor(
    private readonly service: LessonRecordsService,
    private readonly studentsService: StudentsService,
    private readonly settingsService: RecordKeepingSettingsService,
    private readonly attachmentsService: LessonRecordAttachmentsService,
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

  @Query(() => StudentTimelineOutput, { name: 'studentLessonRecordTimeline' })
  @Permissions('RECORD_KEEPING_READ')
  async studentLessonRecordTimeline(
    @Args('studentId', { type: () => ID }) studentId: string,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
    @Args('granularity', {
      type: () => TimelineGranularity,
      defaultValue: TimelineGranularity.WEEK,
    })
    granularity: TimelineGranularity,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StudentTimelineOutput> {
    await this.studentsService.assertStudentVisibleToUser(
      studentId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.service.getStudentTimeline(
      studentId,
      orgId,
      from,
      to,
      granularity,
    );
  }

  @Query(() => EngagementTimelineOutput, {
    name: 'classroomEngagementTimeline',
  })
  @Permissions('RECORD_KEEPING_READ')
  async classroomEngagementTimeline(
    @Args('schoolClassId', { type: () => ID }) schoolClassId: string,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
    @Args('granularity', {
      type: () => TimelineGranularity,
      defaultValue: TimelineGranularity.WEEK,
    })
    granularity: TimelineGranularity,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<EngagementTimelineOutput> {
    await this.studentsService.assertSchoolClassVisibleToUser(
      schoolClassId,
      user.sub,
      user.roles ?? [],
      user.isSuperAdmin ?? false,
      orgId,
    );
    return this.service.getClassroomEngagementTimeline(
      schoolClassId,
      orgId,
      from,
      to,
      granularity,
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

  /**
   * Fetches one recording ACT by its record ids — used by the edit view to
   * pre-fill the bulk-entry form for a `recentLessonRecords` row. Every
   * record's student must be visible to the caller, same guard as the
   * single-record `lessonRecord` query.
   */
  @Query(() => [LessonRecord], { name: 'lessonRecordsByIds' })
  @Permissions('RECORD_KEEPING_READ')
  async findManyByIds(
    @Args('ids', { type: () => [ID] }) ids: string[],
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const records = await this.service.findManyByIds(ids, orgId);
    for (const record of records) {
      await this.studentsService.assertStudentVisibleToUser(
        record.studentId,
        user.sub,
        user.roles ?? [],
        user.isSuperAdmin ?? false,
        orgId,
      );
    }
    return records;
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

  /**
   * The caller's own last recording acts. No student/class guard is needed:
   * the service scopes to (organizationId, recordedById), so a user only ever
   * sees rows they wrote themselves in their own active org.
   */
  @Query(() => [RecentLessonRecordOutput], { name: 'recentLessonRecords' })
  @Permissions('RECORD_KEEPING_READ')
  async recentLessonRecords(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
    @Args('limit', {
      type: () => Int,
      defaultValue: DEFAULT_RECENT_LIMIT,
      nullable: true,
    })
    limit: number,
    @Args('locale', { type: () => String, defaultValue: 'de' }) locale: string,
  ): Promise<RecentLessonRecordOutput[]> {
    return this.service.getRecentLessonRecords(orgId, user.sub, limit, locale);
  }

  /**
   * Stat-card summary for the "Fortschritte" overview page. Same scoping as
   * recentLessonRecords: (organizationId, recordedById), no student/class
   * guard needed.
   */
  @Query(() => MyLessonRecordStatsOutput, { name: 'myLessonRecordStats' })
  @Permissions('RECORD_KEEPING_READ')
  async myLessonRecordStats(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<MyLessonRecordStatsOutput> {
    return this.service.getMyLessonRecordStats(orgId, user.sub);
  }

  /**
   * Attachment metadata for a record. The binary is NOT served here — the
   * client takes the id and calls GET /lesson-record-attachments/:id, which
   * re-checks the org. Resolved with the caller's org rather than the
   * parent's, so even a record reached through some future unscoped path
   * cannot surface another tenant's files.
   */
  @ResolveField(() => [LessonRecordAttachment], { name: 'attachments' })
  @Permissions('RECORD_KEEPING_READ')
  async attachments(
    @Parent() record: LessonRecord,
    @CurrentOrgId() orgId: string,
  ): Promise<LessonRecordAttachment[]> {
    return this.attachmentsService.findByRecord(record.id, orgId);
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

  /**
   * Bulk-edits status/duration for every record in one recording ACT (a
   * `recentLessonRecords` row) — the counterpart of `updateLessonRecord` for
   * the grouped overview table, where a "row" is many `LessonRecord`s.
   */
  @Mutation(() => [LessonRecord])
  @Permissions('RECORD_KEEPING_WRITE')
  async updateLessonRecordsGroup(
    @Args('input') input: UpdateLessonRecordsGroupInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const records = await this.service.findManyByIds(input.recordIds, orgId);
    for (const record of records) {
      await this.studentsService.assertStudentVisibleToUser(
        record.studentId,
        user.sub,
        user.roles ?? [],
        user.isSuperAdmin ?? false,
        orgId,
      );
    }
    // Students newly added to the group (not part of any existing record)
    // need the same visibility check before they can be written.
    const existingStudentIds = new Set(records.map((r) => r.studentId));
    for (const sid of input.studentIds ?? []) {
      if (existingStudentIds.has(sid)) continue;
      await this.studentsService.assertStudentVisibleToUser(
        sid,
        user.sub,
        user.roles ?? [],
        user.isSuperAdmin ?? false,
        orgId,
      );
    }
    return this.service.updateGroup(input, orgId, user.sub);
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

  /**
   * Deletes every record behind one overview-table row — the group
   * counterpart of `deleteLessonRecord`, mirroring `updateLessonRecordsGroup`.
   */
  @Mutation(() => Boolean)
  @Permissions('RECORD_KEEPING_WRITE')
  async deleteLessonRecordsGroup(
    @Args('recordIds', { type: () => [ID] }) recordIds: string[],
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    const records = await this.service.findManyByIds(recordIds, orgId);
    for (const record of records) {
      await this.studentsService.assertStudentVisibleToUser(
        record.studentId,
        user.sub,
        user.roles ?? [],
        user.isSuperAdmin ?? false,
        orgId,
      );
    }
    return this.service.deleteGroup(recordIds, orgId);
  }
}
