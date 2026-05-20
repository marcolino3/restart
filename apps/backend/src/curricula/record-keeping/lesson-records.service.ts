import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CurriculumNode } from '../entities/curriculum-node.entity';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { CreateLessonRecordInput } from './dto/create-lesson-record.input';
import { CreateLessonRecordsBulkInput } from './dto/create-lesson-records-bulk.input';
import { LessonRecordObservationInput } from './dto/lesson-record-observation.input';
import { LessonRecordsFilterInput } from './dto/lesson-records-filter.input';
import { UpdateLessonRecordInput } from './dto/update-lesson-record.input';
import {
  AttentionReason,
  StudentAttentionSummaryOutput,
} from './dto/attention-summary.output';
import {
  ClassroomHeatmapDataOutput,
  HeatmapAreaOutput,
  HeatmapCellOutput,
  HeatmapStudentOutput,
} from './dto/classroom-heatmap.output';
import {
  EngagementTimelineOutput,
  StudentTimelineOutput,
  TimelineGranularity,
} from './dto/timeline.output';
import { LessonRecordStatus } from '../enums/lesson-record-status.enum';
import { LessonRecord } from './entities/lesson-record.entity';
import {
  AttentionRecordInput,
  AttentionThresholds,
  DEFAULT_ATTENTION_THRESHOLDS,
  deriveStudentAttentionItems,
} from './lib/derive-attention';

@Injectable()
export class LessonRecordsService {
  constructor(
    @InjectRepository(LessonRecord)
    private readonly recordsRepo: Repository<LessonRecord>,
    @InjectRepository(CurriculumNode)
    private readonly nodesRepo: Repository<CurriculumNode>,
    @InjectRepository(Student)
    private readonly studentsRepo: Repository<Student>,
    @InjectRepository(SchoolClassEnrollment)
    private readonly enrollmentsRepo: Repository<SchoolClassEnrollment>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, organizationId: string): Promise<LessonRecord> {
    const record = await this.recordsRepo.findOne({
      where: { id, organizationId },
      relations: ['lesson', 'student', 'recordedBy'],
    });
    if (!record) {
      throw new NotFoundException(`Lesson record ${id} not found`);
    }
    return record;
  }

  async find(
    filter: LessonRecordsFilterInput,
    organizationId: string,
    /** Optional row-level scoping: when set, restricts results to records
     *  of students the given non-admin user can see. Admin callers should
     *  pass `null` to skip the join. */
    teacherUserId: string | null = null,
  ): Promise<LessonRecord[]> {
    const qb = this.recordsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.lesson', 'lesson')
      .leftJoinAndSelect('lesson.translations', 'lessonTranslations')
      .leftJoinAndSelect('r.student', 'student')
      .where('r.organization_id = :orgId', { orgId: organizationId });

    if (teacherUserId) {
      qb.andWhere(
        `r.student_id IN (
          SELECT DISTINCT e.student_id
          FROM "school_class_enrollments" e
          INNER JOIN "school_class_teachers" sct
            ON sct.school_class_id = e.school_class_id
          INNER JOIN "memberships" m
            ON m.employee_id = sct.employee_id
          WHERE m.user_id = :teacherUid
            AND m.organization_id = :orgId
            AND m."isActive" = true
            AND e.organization_id = :orgId
            AND e."isActive" = true
            AND e.left_at IS NULL
        )`,
        { teacherUid: teacherUserId },
      );
    }

    if (filter.studentId) {
      qb.andWhere('r.student_id = :studentId', { studentId: filter.studentId });
    }
    if (filter.lessonId) {
      qb.andWhere('r.lesson_id = :lessonId', { lessonId: filter.lessonId });
    }
    if (filter.recordedFrom) {
      qb.andWhere('r.recorded_at >= :from', { from: filter.recordedFrom });
    }
    if (filter.recordedTo) {
      qb.andWhere('r.recorded_at <= :to', { to: filter.recordedTo });
    }
    if (filter.statuses && filter.statuses.length > 0) {
      qb.andWhere('r.status IN (:...statuses)', { statuses: filter.statuses });
    }
    if (filter.schoolClassId) {
      qb.andWhere(
        `r.student_id IN (
          SELECT e.student_id FROM "school_class_enrollments" e
          WHERE e.school_class_id = :scId
            AND e.organization_id = :orgId
            AND (e.left_at IS NULL OR e.left_at >= COALESCE(:from, CURRENT_DATE))
        )`,
        { scId: filter.schoolClassId, from: filter.recordedFrom ?? null },
      );
    }

    return qb.orderBy('r.recorded_at', 'DESC').getMany();
  }

  /**
   * Aktueller Status pro Kind × Lektion = der neueste Record (by recorded_at, fallback createdAt).
   */
  async findCurrent(
    studentId: string,
    lessonId: string,
    organizationId: string,
  ): Promise<LessonRecord | null> {
    return this.recordsRepo.findOne({
      where: { studentId, lessonId, organizationId },
      order: { recordedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(
    input: CreateLessonRecordInput,
    organizationId: string,
    recordedById: string,
  ): Promise<LessonRecord> {
    await this.assertLessonInOrg(input.lessonId, organizationId);
    await this.assertStudentInOrg(input.studentId, organizationId);
    if (input.schoolClassEnrollmentId) {
      await this.assertEnrollmentInOrg(
        input.schoolClassEnrollmentId,
        organizationId,
      );
    }
    const observationFields = this.normalizeObservationForInsert(
      input.observation,
    );

    const record = this.recordsRepo.create({
      studentId: input.studentId,
      lessonId: input.lessonId,
      recordedAt: input.recordedAt,
      status: input.status,
      note: input.note ?? null,
      schoolClassEnrollmentId: input.schoolClassEnrollmentId ?? null,
      recordedById,
      organizationId,
      ...observationFields,
    });
    return this.recordsRepo.save(record);
  }

  /**
   * Lesson-First Bulk-Eingabe: eine Lektion → N Kinder → ein Status.
   * Schreibt eine Reihe pro Kind in einer Transaktion.
   */
  async createBulk(
    input: CreateLessonRecordsBulkInput,
    organizationId: string,
    recordedById: string,
  ): Promise<LessonRecord[]> {
    await this.assertLessonInOrg(input.lessonId, organizationId);

    const students = await this.studentsRepo.find({
      where: { id: In(input.studentIds), organizationId },
      select: ['id'],
    });
    if (students.length !== input.studentIds.length) {
      throw new BadRequestException(
        'One or more students not found in this organization',
      );
    }

    const observationFields = this.normalizeObservationForInsert(
      input.observation,
    );

    return this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(LessonRecord);
      const rows = input.studentIds.map((sid) =>
        repo.create({
          studentId: sid,
          lessonId: input.lessonId,
          recordedAt: input.recordedAt,
          status: input.status,
          note: input.note ?? null,
          recordedById,
          organizationId,
          ...observationFields,
        }),
      );
      return repo.save(rows);
    });
  }

  async update(
    input: UpdateLessonRecordInput,
    organizationId: string,
  ): Promise<LessonRecord> {
    const record = await this.findById(input.id, organizationId);
    if (input.recordedAt !== undefined) record.recordedAt = input.recordedAt;
    if (input.status !== undefined) record.status = input.status;
    if (input.note !== undefined) record.note = input.note;
    this.applyObservationPatch(record, input.observation);
    return this.recordsRepo.save(record);
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const record = await this.findById(id, organizationId);
    await this.recordsRepo.delete({ id: record.id, organizationId });
    return true;
  }

  /**
   * Aggregates attention summaries for one classroom server-side.
   *
   * One DB roundtrip pulls every record of the class's students with the
   * minimal lesson + ancestor fields needed by the heuristic. Returns a
   * shaped payload (~5 KB per class) instead of raw records (~250 KB).
   */
  async getClassroomAttentionSummaries(
    schoolClassId: string,
    organizationId: string,
    locale: string,
    thresholds: AttentionThresholds = DEFAULT_ATTENTION_THRESHOLDS,
  ): Promise<StudentAttentionSummaryOutput[]> {
    // Single query: records of every active enrollee of the class. We only
    // select the columns the heuristic needs to keep payload small.
    const rows: Array<{
      r_id: string;
      r_student_id: string;
      r_lesson_id: string;
      r_recorded_at: string;
      r_status: string;
      lesson_id: string;
      student_id: string;
      student_first_name: string;
      student_last_name: string;
      lesson_translations: { locale: string; name: string }[] | null;
      ancestors:
        | Array<{
            id: string;
            nodeType: string;
            translations: { locale: string; name: string }[];
          }>
        | null;
    }> = await this.recordsRepo.query(
      `
      WITH RECURSIVE class_students AS (
        SELECT DISTINCT e.student_id
        FROM "school_class_enrollments" e
        WHERE e.school_class_id = $1
          AND e.organization_id = $2
          AND e."isActive" = true
          AND e.left_at IS NULL
      ),
      -- Lessons that appear in this class's records (small set).
      class_lessons AS (
        SELECT DISTINCT lesson_id
        FROM "lesson_records"
        WHERE organization_id = $2
          AND student_id IN (SELECT student_id FROM class_students)
      ),
      -- Walk up the parent chain for each class_lesson (max depth 8).
      ancestor_chain AS (
        SELECT
          cl.lesson_id AS root_id,
          n.id,
          n.parent_id,
          n.node_type,
          0 AS depth
        FROM class_lessons cl
        JOIN curriculum_nodes n ON n.id = cl.lesson_id
        WHERE n.organization_id = $2
        UNION ALL
        SELECT
          ac.root_id,
          p.id,
          p.parent_id,
          p.node_type,
          ac.depth + 1
        FROM ancestor_chain ac
        JOIN curriculum_nodes p ON p.id = ac.parent_id
        WHERE p.organization_id = $2
          AND ac.depth < 8
      ),
      lesson_ancestors AS (
        SELECT
          root_id AS lesson_id,
          json_agg(
            json_build_object(
              'id', id,
              'nodeType', node_type,
              'translations', COALESCE(
                (
                  SELECT json_agg(json_build_object('locale', t.locale, 'name', t.name))
                  FROM curriculum_node_translations t
                  WHERE t.curriculum_node_id = ancestor_chain.id
                ),
                '[]'::json
              )
            ) ORDER BY depth ASC
          ) FILTER (WHERE depth > 0) AS ancestors
        FROM ancestor_chain
        GROUP BY root_id
      )
      SELECT
        r.id AS r_id,
        r.student_id AS r_student_id,
        r.lesson_id AS r_lesson_id,
        r.recorded_at::text AS r_recorded_at,
        r.status::text AS r_status,
        s.id AS student_id,
        s."firstName" AS student_first_name,
        s."lastName" AS student_last_name,
        lesson.id AS lesson_id,
        (
          SELECT json_agg(json_build_object('locale', t.locale, 'name', t.name))
          FROM curriculum_node_translations t
          WHERE t.curriculum_node_id = lesson.id
        ) AS lesson_translations,
        la.ancestors
      FROM "lesson_records" r
      INNER JOIN "students" s ON s.id = r.student_id
      INNER JOIN "curriculum_nodes" lesson ON lesson.id = r.lesson_id
      LEFT JOIN lesson_ancestors la ON la.lesson_id = lesson.id
      WHERE r.organization_id = $2
        AND r.student_id IN (SELECT student_id FROM class_students)
      ORDER BY r.student_id, r.recorded_at
      `,
      [schoolClassId, organizationId],
    );

    // Group rows by student → run the heuristic per student.
    const byStudent = new Map<
      string,
      {
        firstName: string;
        lastName: string;
        records: AttentionRecordInput[];
      }
    >();

    for (const row of rows) {
      let bucket = byStudent.get(row.r_student_id);
      if (!bucket) {
        bucket = {
          firstName: row.student_first_name,
          lastName: row.student_last_name,
          records: [],
        };
        byStudent.set(row.r_student_id, bucket);
      }
      bucket.records.push({
        id: row.r_id,
        studentId: row.r_student_id,
        lessonId: row.r_lesson_id,
        recordedAt: row.r_recorded_at,
        // Cast: enum values are the strings we declared in the enum file.
        status: row.r_status as AttentionRecordInput['status'],
        lesson: {
          id: row.lesson_id,
          translations: row.lesson_translations ?? [],
          ancestors: row.ancestors ?? [],
        },
      });
    }

    const summaries: StudentAttentionSummaryOutput[] = [];
    for (const [studentId, { firstName, lastName, records }] of byStudent) {
      const items = deriveStudentAttentionItems(
        records,
        locale,
        thresholds,
      );
      if (items.length === 0) continue;

      const byReason = {
        NEEDS_MORE_CURRENT: 0,
        REPEATED_NEEDS_MORE: 0,
        STUCK_PRACTICED: 0,
        STUCK_INTRODUCED: 0,
        BIG_GAP_INTRO_TO_PRACTICED: 0,
      };
      for (const i of items) byReason[i.reason] += 1;

      summaries.push({
        studentId,
        firstName,
        lastName,
        totalSignals: items.length,
        topItems: items.slice(0, 3).map((i) => ({
          ...i,
          reason: i.reason as AttentionReason,
        })),
        byReason,
      });
    }

    summaries.sort((a, b) => {
      if (a.totalSignals !== b.totalSignals)
        return b.totalSignals - a.totalSignals;
      return `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
      );
    });

    return summaries;
  }

  /**
   * Aggregierte Heatmap-Daten fuer eine Klasse: pro (Kind × AREA) ein
   * Bucket mit Counts pro Status, basierend auf dem JUEINGSTEN Record
   * pro (Kind × Lektion).
   *
   * Server-seitige Aggregation via Recursive CTE — frueher hat der
   * Frontend-Action ALLE Records der Klasse plus lesson.ancestors
   * geladen (5000+ Rows + N+1) und in JS aggregiert. Jetzt: ein CTE,
   * ~750 aggregierte Zeilen.
   */
  async getClassroomHeatmapData(
    schoolClassId: string,
    organizationId: string,
    locale: string,
  ): Promise<ClassroomHeatmapDataOutput> {
    const normalizedLocale = (locale ?? 'de').toUpperCase();

    // 1) Studenten der Klasse (aktive Enrollments).
    const studentRows = await this.dataSource.query<
      Array<{ id: string; first_name: string; last_name: string }>
    >(
      `SELECT DISTINCT s.id::text AS id,
                       s."firstName" AS first_name,
                       s."lastName"  AS last_name
         FROM school_class_enrollments e
         INNER JOIN students s ON s.id = e.student_id
        WHERE e.school_class_id = $1
          AND e.organization_id = $2
          AND e."isActive" = true
          AND e.left_at IS NULL
          AND s."isActive" = true`,
      [schoolClassId, organizationId],
    );

    const students: HeatmapStudentOutput[] = studentRows
      .map((r) => ({
        studentId: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
      }))
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
        ),
      );

    if (students.length === 0) {
      return { students, areas: [], cells: [] };
    }

    // 2) Eine Mega-Query: latest record per (student, lesson), walke
    //    Curriculum-Tree hoch bis AREA, aggregiere pro
    //    (student, area, status).
    const aggregateRows = await this.dataSource.query<
      Array<{
        student_id: string;
        area_id: string;
        curriculum_id: string | null;
        status: string;
        count: number;
      }>
    >(
      `WITH RECURSIVE active_students AS (
         SELECT DISTINCT e.student_id
           FROM school_class_enrollments e
          WHERE e.school_class_id = $1
            AND e.organization_id = $2
            AND e."isActive" = true
            AND e.left_at IS NULL
       ),
       latest_records AS (
         SELECT DISTINCT ON (lr.student_id, lr.lesson_id)
                lr.student_id, lr.lesson_id, lr.status
           FROM lesson_records lr
           INNER JOIN active_students a ON a.student_id = lr.student_id
          WHERE lr.organization_id = $2
          ORDER BY lr.student_id, lr.lesson_id, lr.recorded_at DESC, lr.id DESC
       ),
       up AS (
         SELECT id AS start_id,
                id AS cur_id,
                parent_id,
                node_type,
                curriculum_id,
                0 AS depth
           FROM curriculum_nodes
          WHERE id IN (SELECT DISTINCT lesson_id FROM latest_records)
            AND organization_id = $2
          UNION ALL
         SELECT u.start_id,
                n.id,
                n.parent_id,
                n.node_type,
                n.curriculum_id,
                u.depth + 1
           FROM curriculum_nodes n
           JOIN up u ON n.id = u.parent_id
          WHERE n.organization_id = $2
            AND u.depth < 16
       )
       SELECT lr.student_id::text     AS student_id,
              u.cur_id::text          AS area_id,
              u.curriculum_id::text   AS curriculum_id,
              lr.status::text         AS status,
              COUNT(*)::int           AS count
         FROM latest_records lr
         INNER JOIN up u
           ON u.start_id = lr.lesson_id
          AND u.node_type = 'AREA'
        GROUP BY lr.student_id, u.cur_id, u.curriculum_id, lr.status`,
      [schoolClassId, organizationId],
    );

    if (aggregateRows.length === 0) {
      return { students, areas: [], cells: [] };
    }

    const cells: HeatmapCellOutput[] = aggregateRows.map((r) => ({
      studentId: r.student_id,
      areaId: r.area_id,
      status: r.status as LessonRecordStatus,
      count: Number(r.count),
    }));

    // 3) Area-Namen + Curriculum-Namen (fuer Disambiguierung gleicher
    //    AREA-Namen aus verschiedenen Curricula, z.B. "Mathematik").
    const areaIds = Array.from(new Set(aggregateRows.map((r) => r.area_id)));
    const curriculumIds = Array.from(
      new Set(
        aggregateRows
          .map((r) => r.curriculum_id)
          .filter((c): c is string => c !== null),
      ),
    );

    type TransRow = { ref_id: string; locale: string; name: string };

    const [areaNameRows, curriculumNameRows] = await Promise.all([
      this.dataSource.query<TransRow[]>(
        `SELECT curriculum_node_id::text AS ref_id, locale::text, name
           FROM curriculum_node_translations
          WHERE curriculum_node_id = ANY($1::uuid[])`,
        [areaIds],
      ),
      curriculumIds.length === 0
        ? Promise.resolve([] as TransRow[])
        : this.dataSource.query<TransRow[]>(
            `SELECT curriculum_id::text AS ref_id, locale::text, name
               FROM curriculum_translations
              WHERE curriculum_id = ANY($1::uuid[])`,
            [curriculumIds],
          ),
    ]);

    const pickName = (
      rows: Array<{ locale: string; name: string }>,
    ): string | null => {
      if (rows.length === 0) return null;
      const byLocale = new Map<string, string>();
      for (const r of rows) byLocale.set(r.locale.toUpperCase(), r.name);
      return (
        byLocale.get(normalizedLocale) ?? byLocale.get('EN') ?? rows[0].name
      );
    };

    const collect = (
      rows: TransRow[],
    ): Map<string, Array<{ locale: string; name: string }>> => {
      const out = new Map<string, Array<{ locale: string; name: string }>>();
      for (const r of rows) {
        const arr = out.get(r.ref_id) ?? [];
        arr.push({ locale: r.locale, name: r.name });
        out.set(r.ref_id, arr);
      }
      return out;
    };

    const areaTrans = collect(areaNameRows);
    const curriculumTrans = collect(curriculumNameRows);

    const areaBaseName = new Map<string, string>();
    for (const id of areaIds) {
      areaBaseName.set(id, pickName(areaTrans.get(id) ?? []) ?? '—');
    }

    // Curriculum-ID pro Area (eindeutig, weil ein Node nur zu einem
    // Curriculum gehoert).
    const curriculumByArea = new Map<string, string | null>();
    for (const r of aggregateRows) {
      if (!curriculumByArea.has(r.area_id)) {
        curriculumByArea.set(r.area_id, r.curriculum_id ?? null);
      }
    }

    // Disambiguierung: wenn derselbe Area-Name in mehreren Areas auftaucht,
    // Curriculum-Name als Suffix.
    const nameCounts = new Map<string, number>();
    for (const name of areaBaseName.values()) {
      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    }

    const areas: HeatmapAreaOutput[] = Array.from(areaBaseName.entries())
      .map(([areaId, baseName]) => {
        const isDup = (nameCounts.get(baseName) ?? 0) > 1;
        const cId = curriculumByArea.get(areaId);
        const curriculumName = cId
          ? pickName(curriculumTrans.get(cId) ?? [])
          : null;
        const suffix = isDup && curriculumName ? curriculumName.trim() : null;
        return {
          areaId,
          areaName: suffix ? `${baseName} · ${suffix}` : baseName,
        };
      })
      .sort((a, b) => a.areaName.localeCompare(b.areaName));

    return { students, areas, cells };
  }

  /**
   * Pro Kind aggregierte Timeline der Lesson-Records, gebuckt nach
   * date_trunc(granularity). Liefert pro Bucket die Counts pro Status.
   *
   * Multi-Tenant: organizationId-Filter. Row-Level-Visibility prüft der
   * Resolver vorab via studentsService.assertStudentVisibleToUser.
   */
  async getStudentTimeline(
    studentId: string,
    organizationId: string,
    from: string,
    to: string,
    granularity: TimelineGranularity,
  ): Promise<StudentTimelineOutput> {
    const pgUnit = this.toPgDateTruncUnit(granularity);

    const rows = await this.recordsRepo.query<
      Array<{
        bucket_start: string;
        status: string;
        count: string;
      }>
    >(
      `SELECT date_trunc($1, r.recorded_at)::date::text AS bucket_start,
              r.status::text AS status,
              COUNT(*)::int AS count
         FROM lesson_records r
        WHERE r.organization_id = $2
          AND r.student_id = $3
          AND r.recorded_at >= $4::date
          AND r.recorded_at <= $5::date
        GROUP BY 1, 2
        ORDER BY 1 ASC`,
      [pgUnit, organizationId, studentId, from, to],
    );

    const byBucket = new Map<
      string,
      {
        planning: number;
        introduced: number;
        practiced: number;
        mastered: number;
        needsMore: number;
      }
    >();
    for (const row of rows) {
      const bucket = byBucket.get(row.bucket_start) ?? {
        planning: 0,
        introduced: 0,
        practiced: 0,
        mastered: 0,
        needsMore: 0,
      };
      const count = Number(row.count);
      switch (row.status as LessonRecordStatus) {
        case LessonRecordStatus.PLANNING:
          bucket.planning += count;
          break;
        case LessonRecordStatus.INTRODUCED:
          bucket.introduced += count;
          break;
        case LessonRecordStatus.PRACTICED:
          bucket.practiced += count;
          break;
        case LessonRecordStatus.MASTERED:
          bucket.mastered += count;
          break;
        case LessonRecordStatus.NEEDS_MORE:
          bucket.needsMore += count;
          break;
      }
      byBucket.set(row.bucket_start, bucket);
    }

    const buckets = Array.from(byBucket.entries())
      .map(([bucketStart, counts]) => ({
        bucketStart,
        ...counts,
        total:
          counts.planning +
          counts.introduced +
          counts.practiced +
          counts.mastered +
          counts.needsMore,
      }))
      .sort((a, b) => a.bucketStart.localeCompare(b.bucketStart));

    const totalIntroductionsInRange = buckets.reduce(
      (sum, b) => sum + b.introduced,
      0,
    );

    // Letzte INTRODUCED-Aufzeichnung — unabhängig vom range (für die
    // Impact-Warnung "seit X Tagen keine Einführung").
    const lastIntro = await this.recordsRepo
      .createQueryBuilder('r')
      .select('MAX(r.recorded_at)', 'last')
      .where('r.organization_id = :orgId', { orgId: organizationId })
      .andWhere('r.student_id = :sid', { sid: studentId })
      .andWhere('r.status = :st', { st: LessonRecordStatus.INTRODUCED })
      .getRawOne<{ last: string | null }>();

    let daysSinceLastIntroduction: number | null = null;
    if (lastIntro?.last) {
      const lastDate = new Date(lastIntro.last);
      const today = new Date();
      const diffMs = today.getTime() - lastDate.getTime();
      daysSinceLastIntroduction = Math.max(
        0,
        Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      );
    }

    return {
      buckets,
      totalIntroductionsInRange,
      daysSinceLastIntroduction,
    };
  }

  /**
   * Engagement-Verlauf der Klasse: pro Bucket die Anzahl Records pro
   * Engagement-Level (NULL-Werte fliessen nicht ein).
   *
   * Multi-Tenant: organizationId-Filter; Visibility prüft der Resolver.
   */
  async getClassroomEngagementTimeline(
    schoolClassId: string,
    organizationId: string,
    from: string,
    to: string,
    granularity: TimelineGranularity,
  ): Promise<EngagementTimelineOutput> {
    const pgUnit = this.toPgDateTruncUnit(granularity);

    const rows = await this.recordsRepo.query<
      Array<{
        bucket_start: string;
        engagement: string;
        count: string;
      }>
    >(
      `SELECT date_trunc($1, r.recorded_at)::date::text AS bucket_start,
              r.engagement::text AS engagement,
              COUNT(*)::int AS count
         FROM lesson_records r
        WHERE r.organization_id = $2
          AND r.engagement IS NOT NULL
          AND r.recorded_at >= $3::date
          AND r.recorded_at <= $4::date
          AND r.student_id IN (
            SELECT DISTINCT e.student_id
              FROM school_class_enrollments e
             WHERE e.school_class_id = $5
               AND e.organization_id = $2
               AND e."isActive" = true
               AND (e.left_at IS NULL OR e.left_at >= $3::date)
          )
        GROUP BY 1, 2
        ORDER BY 1 ASC`,
      [pgUnit, organizationId, from, to, schoolClassId],
    );

    const byBucket = new Map<
      string,
      {
        focused: number;
        interested: number;
        mechanical: number;
        resistant: number;
      }
    >();
    for (const row of rows) {
      const bucket = byBucket.get(row.bucket_start) ?? {
        focused: 0,
        interested: 0,
        mechanical: 0,
        resistant: 0,
      };
      const count = Number(row.count);
      switch (row.engagement) {
        case 'FOCUSED':
          bucket.focused += count;
          break;
        case 'INTERESTED':
          bucket.interested += count;
          break;
        case 'MECHANICAL':
          bucket.mechanical += count;
          break;
        case 'RESISTANT':
          bucket.resistant += count;
          break;
      }
      byBucket.set(row.bucket_start, bucket);
    }

    const buckets = Array.from(byBucket.entries())
      .map(([bucketStart, counts]) => ({
        bucketStart,
        ...counts,
        total:
          counts.focused +
          counts.interested +
          counts.mechanical +
          counts.resistant,
      }))
      .sort((a, b) => a.bucketStart.localeCompare(b.bucketStart));

    const totalObserved = buckets.reduce((sum, b) => sum + b.total, 0);

    return { buckets, totalObserved };
  }

  private toPgDateTruncUnit(g: TimelineGranularity): 'day' | 'week' | 'month' {
    switch (g) {
      case TimelineGranularity.DAY:
        return 'day';
      case TimelineGranularity.WEEK:
        return 'week';
      case TimelineGranularity.MONTH:
        return 'month';
    }
  }

  private async assertLessonInOrg(
    lessonId: string,
    organizationId: string,
  ): Promise<void> {
    const lesson = await this.nodesRepo.findOne({
      where: { id: lessonId, organizationId },
      select: ['id', 'nodeType'],
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }
    if (lesson.nodeType !== CurriculumNodeType.LESSON) {
      throw new BadRequestException(
        `Curriculum node ${lessonId} is ${lesson.nodeType}, expected LESSON`,
      );
    }
  }

  private async assertStudentInOrg(
    studentId: string,
    organizationId: string,
  ): Promise<void> {
    const exists = await this.studentsRepo.exists({
      where: { id: studentId, organizationId },
    });
    if (!exists) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }
  }

  private async assertEnrollmentInOrg(
    enrollmentId: string,
    organizationId: string,
  ): Promise<void> {
    const exists = await this.enrollmentsRepo.exists({
      where: { id: enrollmentId, organizationId },
    });
    if (!exists) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }
  }

  /**
   * Maps an optional observation input onto the LessonRecord field slice used
   * by INSERTs. Missing values stay undefined so TypeORM applies column
   * defaults; explicit nulls clear the value.
   */
  private normalizeObservationForInsert(
    input: LessonRecordObservationInput | null | undefined,
  ): Partial<LessonRecord> {
    if (!input) return {};
    const slice: Partial<LessonRecord> = {
      engagement: input.engagement ?? null,
      difficulty: input.difficulty ?? null,
      socialForm: input.socialForm ?? null,
      selfAssessment: input.selfAssessment ?? null,
      lessonClarityConfirmed: input.lessonClarityConfirmed ?? null,
      teacherPreparation: input.teacherPreparation ?? null,
      roomMood: input.roomMood ?? null,
      teacherStressLevel: input.teacherStressLevel ?? null,
      selfConfidence: input.selfConfidence ?? null,
      persistence: input.persistence ?? null,
      concentration: input.concentration ?? null,
    };
    if (input.selfAssessmentByChild !== undefined) {
      slice.selfAssessmentByChild = input.selfAssessmentByChild;
    }
    this.assertSelfAssessmentSourceConsistent(
      slice.selfAssessmentByChild ?? false,
      slice.selfAssessment ?? null,
    );
    return slice;
  }

  /**
   * Patch semantics: undefined leaves the existing value; null clears it.
   */
  private applyObservationPatch(
    record: LessonRecord,
    input: LessonRecordObservationInput | null | undefined,
  ): void {
    if (input === undefined) return;
    if (input === null) {
      record.engagement = null;
      record.difficulty = null;
      record.socialForm = null;
      record.selfAssessment = null;
      record.selfAssessmentByChild = false;
      record.lessonClarityConfirmed = null;
      record.teacherPreparation = null;
      record.roomMood = null;
      record.teacherStressLevel = null;
      record.selfConfidence = null;
      record.persistence = null;
      record.concentration = null;
      return;
    }
    if (input.engagement !== undefined) record.engagement = input.engagement;
    if (input.difficulty !== undefined) record.difficulty = input.difficulty;
    if (input.socialForm !== undefined) record.socialForm = input.socialForm;
    if (input.selfAssessment !== undefined) {
      record.selfAssessment = input.selfAssessment;
    }
    if (input.selfAssessmentByChild !== undefined) {
      record.selfAssessmentByChild = input.selfAssessmentByChild;
    }
    if (input.lessonClarityConfirmed !== undefined) {
      record.lessonClarityConfirmed = input.lessonClarityConfirmed;
    }
    if (input.teacherPreparation !== undefined) {
      record.teacherPreparation = input.teacherPreparation;
    }
    if (input.roomMood !== undefined) record.roomMood = input.roomMood;
    if (input.teacherStressLevel !== undefined) {
      record.teacherStressLevel = input.teacherStressLevel;
    }
    if (input.selfConfidence !== undefined) {
      record.selfConfidence = input.selfConfidence;
    }
    if (input.persistence !== undefined) record.persistence = input.persistence;
    if (input.concentration !== undefined) {
      record.concentration = input.concentration;
    }
    this.assertSelfAssessmentSourceConsistent(
      record.selfAssessmentByChild,
      record.selfAssessment ?? null,
    );
  }

  private assertSelfAssessmentSourceConsistent(
    byChild: boolean,
    selfAssessment: unknown,
  ): void {
    if (byChild && selfAssessment === null) {
      throw new BadRequestException(
        'selfAssessmentByChild=true requires selfAssessment to be set',
      );
    }
  }
}
