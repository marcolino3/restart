/**
 * Integration test for lesson-record attachments and the recent-records query.
 *
 * Covers what a mock-based unit test cannot: real FK behaviour (attachment
 * CASCADE when the record goes, uploader SET NULL when the user goes), the
 * recorded_at x lesson grouping in actual SQL, and — the point of this file —
 * multi-tenant isolation: a user acting in org B must not be able to read,
 * delete or attach to anything belonging to org A. These assertions fail for
 * real if the org filter is ever dropped from the service.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=lesson-record-attachments
 */
import { ForbiddenException, Module, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Curriculum } from '@/curricula/entities/curriculum.entity';
import { CurriculumLevel } from '@/curricula/entities/curriculum-level.entity';
import { CurriculumNode } from '@/curricula/entities/curriculum-node.entity';
import { CurriculumNodeTranslation } from '@/curricula/entities/curriculum-node-translation.entity';
import { CurriculumNodeType } from '@/curricula/enums/curriculum-node-type.enum';
import { CurriculumLocale } from '@/curricula/enums/curriculum-locale.enum';
import { LessonRecordStatus } from '@/curricula/enums/lesson-record-status.enum';
import { LessonRecordAttachment } from '@/curricula/record-keeping/entities/lesson-record-attachment.entity';
import { LessonRecord } from '@/curricula/record-keeping/entities/lesson-record.entity';
import { LessonRecordAttachmentsService } from '@/curricula/record-keeping/lesson-record-attachments.service';
import { LessonRecordsService } from '@/curricula/record-keeping/lesson-records.service';
import { Organization } from '@/organizations/entities/organization.entity';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { User } from '@/users/entities/user.entity';
import { cleanDatabase, createTestingApp } from './test-utils';

// Minimal module: wires the two services + their entity repos, avoiding the
// full CurriculaModule -> better-auth (ESM) chain.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonRecord,
      LessonRecordAttachment,
      CurriculumNode,
      Student,
      SchoolClassEnrollment,
    ]),
  ],
  providers: [LessonRecordsService, LessonRecordAttachmentsService],
})
class LessonRecordAttachmentsTestModule {}

describe('LessonRecordAttachments (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let attachments: LessonRecordAttachmentsService;
  let records: LessonRecordsService;

  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;
  let studentRepo: Repository<Student>;
  let curriculumRepo: Repository<Curriculum>;
  let levelRepo: Repository<CurriculumLevel>;
  let nodeRepo: Repository<CurriculumNode>;
  let translationRepo: Repository<CurriculumNodeTranslation>;
  let recordRepo: Repository<LessonRecord>;
  let attachmentRepo: Repository<LessonRecordAttachment>;

  beforeAll(async () => {
    const app = await createTestingApp([LessonRecordAttachmentsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    attachments = module.get(LessonRecordAttachmentsService);
    records = module.get(LessonRecordsService);

    orgRepo = dataSource.getRepository(Organization);
    userRepo = dataSource.getRepository(User);
    studentRepo = dataSource.getRepository(Student);
    curriculumRepo = dataSource.getRepository(Curriculum);
    levelRepo = dataSource.getRepository(CurriculumLevel);
    nodeRepo = dataSource.getRepository(CurriculumNode);
    translationRepo = dataSource.getRepository(CurriculumNodeTranslation);
    recordRepo = dataSource.getRepository(LessonRecord);
    attachmentRepo = dataSource.getRepository(LessonRecordAttachment);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  // --- seed helpers ---

  const seedOrg = () => orgRepo.save(orgRepo.create({}));

  let userSeq = 0;
  const seedUser = (): Promise<User> =>
    userRepo.save(
      userRepo.create({
        firstName: `Lehr${++userSeq}`,
        lastName: 'Person',
      }),
    );

  const seedStudent = (organizationId: string, firstName = 'Kind') =>
    studentRepo.save(
      studentRepo.create({ firstName, lastName: 'Muster', organizationId }),
    );

  /** A curriculum with an AREA -> LESSON chain, both named in DE. */
  const seedLesson = async (
    organizationId: string,
    areaName = 'Mathematik',
    lessonName = 'Goldenes Perlenmaterial',
  ) => {
    const curriculum = await curriculumRepo.save(
      curriculumRepo.create({ slug: `c-${Math.random()}`, organizationId }),
    );
    const level = await levelRepo.save(
      levelRepo.create({
        slug: `l-${Math.random()}`,
        curriculumId: curriculum.id,
        organizationId,
      }),
    );
    const area = await nodeRepo.save(
      nodeRepo.create({
        curriculumId: curriculum.id,
        levelId: level.id,
        nodeType: CurriculumNodeType.AREA,
        organizationId,
      }),
    );
    const lesson = await nodeRepo.save(
      nodeRepo.create({
        curriculumId: curriculum.id,
        levelId: level.id,
        parentId: area.id,
        nodeType: CurriculumNodeType.LESSON,
        organizationId,
      }),
    );
    await translationRepo.save([
      translationRepo.create({
        curriculumNodeId: area.id,
        locale: CurriculumLocale.DE,
        name: areaName,
      }),
      translationRepo.create({
        curriculumNodeId: lesson.id,
        locale: CurriculumLocale.DE,
        name: lessonName,
      }),
    ]);
    return { lesson, area };
  };

  const seedRecord = (
    organizationId: string,
    studentId: string,
    lessonId: string,
    recordedById: string,
    recordedAt = '2026-05-16',
  ) =>
    recordRepo.save(
      recordRepo.create({
        organizationId,
        studentId,
        lessonId,
        recordedById,
        recordedAt,
        status: LessonRecordStatus.INTRODUCED,
        selfAssessmentByChild: false,
      }),
    );

  const attach = (
    lessonRecordId: string,
    organizationId: string,
    uploadedById: string | null,
    fileName = 'work.png',
  ) =>
    attachments.create({
      lessonRecordId,
      organizationId,
      storageKey: `lesson-records/${organizationId}/${fileName}`,
      fileName,
      mimeType: 'image/png',
      sizeBytes: 2048,
      uploadedById,
    });

  // --- persistence ---

  it('persists an attachment and reads it back for its record', async () => {
    const org = await seedOrg();
    const user = await seedUser();
    const student = await seedStudent(org.id);
    const { lesson } = await seedLesson(org.id);
    const record = await seedRecord(org.id, student.id, lesson.id, user.id);

    const created = await attach(record.id, org.id, user.id);
    expect(created.id).toBeDefined();
    expect(created.sizeBytes).toBe(2048);

    const list = await attachments.findByRecord(record.id, org.id);
    expect(list.map((a) => a.fileName)).toEqual(['work.png']);
  });

  it('cascades attachments away when the lesson record is deleted', async () => {
    const org = await seedOrg();
    const user = await seedUser();
    const student = await seedStudent(org.id);
    const { lesson } = await seedLesson(org.id);
    const record = await seedRecord(org.id, student.id, lesson.id, user.id);
    await attach(record.id, org.id, user.id);

    await recordRepo.delete({ id: record.id });

    expect(await attachmentRepo.count()).toBe(0);
  });

  it('nulls the uploader instead of deleting the attachment when the user goes', async () => {
    const org = await seedOrg();
    const user = await seedUser();
    const student = await seedStudent(org.id);
    const { lesson } = await seedLesson(org.id);
    const record = await seedRecord(org.id, student.id, lesson.id, user.id);
    const created = await attach(record.id, org.id, user.id);

    await recordRepo.update({ id: record.id }, { recordedById: null });
    await userRepo.delete({ id: user.id });

    const reloaded = await attachmentRepo.findOne({
      where: { id: created.id },
    });
    expect(reloaded).not.toBeNull();
    expect(reloaded!.uploadedById).toBeNull();
  });

  it('stores the optional durationMinutes and leaves it null when unset', async () => {
    const org = await seedOrg();
    const user = await seedUser();
    const student = await seedStudent(org.id);
    const { lesson } = await seedLesson(org.id);

    const withDuration = await records.create(
      {
        studentId: student.id,
        lessonId: lesson.id,
        recordedAt: '2026-05-16',
        status: LessonRecordStatus.INTRODUCED,
        durationMinutes: 45,
      },
      org.id,
      user.id,
    );
    const without = await records.create(
      {
        studentId: student.id,
        lessonId: lesson.id,
        recordedAt: '2026-05-17',
        status: LessonRecordStatus.INTRODUCED,
      },
      org.id,
      user.id,
    );

    expect(
      (await recordRepo.findOneByOrFail({ id: withDuration.id }))
        .durationMinutes,
    ).toBe(45);
    expect(
      (await recordRepo.findOneByOrFail({ id: without.id })).durationMinutes,
    ).toBeNull();
  });

  // --- multi-tenant isolation (the non-negotiable part) ---

  describe('multi-tenant isolation', () => {
    /** Org A with a record + attachment, and an unrelated org B. */
    const seedTwoOrgs = async () => {
      const orgA = await seedOrg();
      const orgB = await seedOrg();
      const userA = await seedUser();
      const userB = await seedUser();
      const studentA = await seedStudent(orgA.id);
      const { lesson: lessonA } = await seedLesson(orgA.id);
      const recordA = await seedRecord(
        orgA.id,
        studentA.id,
        lessonA.id,
        userA.id,
      );
      const attachmentA = await attach(recordA.id, orgA.id, userA.id, 'a.png');
      return { orgA, orgB, userA, userB, recordA, attachmentA };
    };

    it('org B cannot READ an attachment of org A', async () => {
      const { orgB, attachmentA } = await seedTwoOrgs();

      await expect(
        attachments.findOneOwned(attachmentA.id, orgB.id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('org B does not see org A attachments when listing the record', async () => {
      const { orgB, recordA } = await seedTwoOrgs();

      const list = await attachments.findByRecord(recordA.id, orgB.id);
      expect(list).toEqual([]);
    });

    it('org B cannot DELETE an attachment of org A', async () => {
      const { orgB, attachmentA } = await seedTwoOrgs();

      // The controller path goes through findOneOwned first, which already
      // refuses. Even so, remove() must not delete cross-tenant on its own.
      await attachments.remove(attachmentA.id, orgB.id);

      expect(await attachmentRepo.count()).toBe(1);
      const survivor = await attachmentRepo.findOneByOrFail({
        id: attachmentA.id,
      });
      expect(survivor.organizationId).toBeDefined();
    });

    it('org B cannot UPLOAD onto a lesson record of org A', async () => {
      const { orgB, recordA } = await seedTwoOrgs();

      await expect(
        attachments.assertRecordInOrg(recordA.id, orgB.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('recentLessonRecords never leaks another org’s records', async () => {
      const { orgA, orgB, userA } = await seedTwoOrgs();

      // Same user id acting in org B must see nothing from org A.
      expect(await records.getRecentLessonRecords(orgB.id, userA.id)).toEqual(
        [],
      );
      expect(
        (await records.getRecentLessonRecords(orgA.id, userA.id)).length,
      ).toBe(1);
    });

    it('recentLessonRecords never leaks a colleague’s records', async () => {
      const { orgA, userB } = await seedTwoOrgs();

      expect(await records.getRecentLessonRecords(orgA.id, userB.id)).toEqual(
        [],
      );
    });
  });

  // --- recentLessonRecords semantics ---

  describe('recentLessonRecords', () => {
    it('collapses a bulk entry into one row carrying the student count', async () => {
      const org = await seedOrg();
      const user = await seedUser();
      const { lesson } = await seedLesson(org.id);
      const kids = await Promise.all([
        seedStudent(org.id, 'Anna'),
        seedStudent(org.id, 'Ben'),
        seedStudent(org.id, 'Cem'),
      ]);

      await records.createBulk(
        {
          lessonId: lesson.id,
          studentIds: kids.map((k) => k.id),
          recordedAt: '2026-05-16',
          status: LessonRecordStatus.INTRODUCED,
        },
        org.id,
        user.id,
      );

      const recent = await records.getRecentLessonRecords(org.id, user.id);
      expect(recent).toHaveLength(1);
      expect(recent[0]).toMatchObject({
        lessonId: lesson.id,
        // ISO-8601 — the client parses this with new Date().
        recordedAt: '2026-05-16T00:00:00.000Z',
        studentCount: 3,
        lessonName: 'Goldenes Perlenmaterial',
        areaName: 'Mathematik',
      });
    });

    // Regression: a child can end up with two records inside one group (same
    // lesson + recorded_at + status), e.g. after an edit that re-added it.
    // json_agg without DISTINCT then emitted the child twice, which collided
    // on its React key in the avatar row and contradicted studentCount.
    it('lists a child once even when it holds two records in the same group', async () => {
      const org = await seedOrg();
      const user = await seedUser();
      const { lesson } = await seedLesson(org.id);
      const [anna, ben] = await Promise.all([
        seedStudent(org.id, 'Anna'),
        seedStudent(org.id, 'Ben'),
      ]);

      // Anna twice, Ben once — all sharing lesson + date + status.
      await seedRecord(org.id, anna.id, lesson.id, user.id, '2026-05-16');
      await seedRecord(org.id, anna.id, lesson.id, user.id, '2026-05-16');
      await seedRecord(org.id, ben.id, lesson.id, user.id, '2026-05-16');

      const recent = await records.getRecentLessonRecords(org.id, user.id);

      expect(recent).toHaveLength(1);
      const ids = recent[0].students.map((s) => s.id);
      expect(ids).toHaveLength(new Set(ids).size); // no duplicate keys
      expect(ids).toHaveLength(2);
      expect(recent[0].studentCount).toBe(2);
      // students and studentCount must never disagree
      expect(recent[0].students).toHaveLength(recent[0].studentCount);
      // still sorted by last name, then first name
      expect(recent[0].students.map((s) => s.firstName)).toEqual([
        'Anna',
        'Ben',
      ]);
    });

    // Root cause of the duplicate above: nothing stopped a child from being
    // recorded twice. createBulk must dedupe its payload, and editing a group
    // that already holds a doubled child must collapse it back to one row.
    it('writes one record per child even if an id arrives twice', async () => {
      const org = await seedOrg();
      const user = await seedUser();
      const { lesson } = await seedLesson(org.id);
      const anna = await seedStudent(org.id, 'Anna');

      await records.createBulk(
        {
          lessonId: lesson.id,
          studentIds: [anna.id, anna.id],
          recordedAt: '2026-05-16',
          status: LessonRecordStatus.INTRODUCED,
        },
        org.id,
        user.id,
      );

      const recent = await records.getRecentLessonRecords(org.id, user.id);
      expect(recent).toHaveLength(1);
      expect(recent[0].students).toHaveLength(1);
      expect(recent[0].recordIds).toHaveLength(1);
    });

    it('collapses a child holding two records when the group is edited', async () => {
      const org = await seedOrg();
      const user = await seedUser();
      const { lesson } = await seedLesson(org.id);
      const anna = await seedStudent(org.id, 'Anna');

      const a = await seedRecord(org.id, anna.id, lesson.id, user.id);
      const b = await seedRecord(org.id, anna.id, lesson.id, user.id);

      await records.updateGroup(
        {
          recordIds: [a.id, b.id],
          lessonId: lesson.id,
          recordedAt: '2026-05-16',
          studentIds: [anna.id],
          status: LessonRecordStatus.PRACTICED,
        },
        org.id,
        user.id,
      );

      const recent = await records.getRecentLessonRecords(org.id, user.id);
      expect(recent).toHaveLength(1);
      expect(recent[0].students).toHaveLength(1);
      expect(recent[0].recordIds).toHaveLength(1);
      expect(recent[0].studentCount).toBe(1);
    });

    it('keeps different dates of the same lesson as separate rows, newest first', async () => {
      const org = await seedOrg();
      const user = await seedUser();
      const student = await seedStudent(org.id);
      const { lesson } = await seedLesson(org.id);

      await seedRecord(org.id, student.id, lesson.id, user.id, '2026-05-10');
      await seedRecord(org.id, student.id, lesson.id, user.id, '2026-05-18');
      await seedRecord(org.id, student.id, lesson.id, user.id, '2026-05-14');

      const recent = await records.getRecentLessonRecords(org.id, user.id);
      expect(recent.map((r) => r.recordedAt)).toEqual([
        '2026-05-18T00:00:00.000Z',
        '2026-05-14T00:00:00.000Z',
        '2026-05-10T00:00:00.000Z',
      ]);
    });

    it('returns recordedAt in a format the client can parse', async () => {
      // Regression: a plain ::text cast on timestamptz yields Postgres format
      // ("2026-05-16 00:00:00+00"). That string is truthy but unparsable in
      // the browser, so the edit form rendered Invalid Date and date-fns threw.
      const org = await seedOrg();
      const user = await seedUser();
      const student = await seedStudent(org.id);
      const { lesson } = await seedLesson(org.id);

      await seedRecord(org.id, student.id, lesson.id, user.id, '2026-05-16');

      const [entry] = await records.getRecentLessonRecords(org.id, user.id);
      expect(Number.isNaN(new Date(entry.recordedAt).getTime())).toBe(false);
      expect(entry.recordedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('honours the limit', async () => {
      const org = await seedOrg();
      const user = await seedUser();
      const student = await seedStudent(org.id);
      const { lesson } = await seedLesson(org.id);

      for (const day of ['10', '11', '12', '13', '14', '15', '16']) {
        await seedRecord(
          org.id,
          student.id,
          lesson.id,
          user.id,
          `2026-05-${day}`,
        );
      }

      expect(
        await records.getRecentLessonRecords(org.id, user.id),
      ).toHaveLength(5);
      expect(
        await records.getRecentLessonRecords(org.id, user.id, 2),
      ).toHaveLength(2);
    });

    it('resolves the AREA ancestor name through the curriculum tree', async () => {
      const org = await seedOrg();
      const user = await seedUser();
      const student = await seedStudent(org.id);
      const { lesson } = await seedLesson(
        org.id,
        'Sprache',
        'Sandpapierbuchstaben',
      );
      await seedRecord(org.id, student.id, lesson.id, user.id);

      const [row] = await records.getRecentLessonRecords(org.id, user.id);
      expect(row.areaName).toBe('Sprache');
      expect(row.lessonName).toBe('Sandpapierbuchstaben');
    });
  });
});
