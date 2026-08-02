import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { CurriculumNode } from '../entities/curriculum-node.entity';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { LessonRecordDifficulty } from '../enums/lesson-record-difficulty.enum';
import { LessonRecordEngagement } from '../enums/lesson-record-engagement.enum';
import { LessonRecordSelfAssessment } from '../enums/lesson-record-self-assessment.enum';
import { LessonRecordSocialForm } from '../enums/lesson-record-social-form.enum';
import { LessonRecordStatus } from '../enums/lesson-record-status.enum';
import { LessonRecord } from './entities/lesson-record.entity';
import { LessonRecordsService } from './lesson-records.service';

describe('LessonRecordsService', () => {
  let service: LessonRecordsService;
  let recordsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    findBy: jest.Mock;
    delete: jest.Mock;
  };
  let nodesRepo: { findOne: jest.Mock };
  let studentsRepo: { exists: jest.Mock; find: jest.Mock };
  let enrollmentsRepo: { exists: jest.Mock };
  let dataSource: { query: jest.Mock; transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
      // Runs the callback against the same repos the test already mocked —
      // good enough since these tests assert on the (fake) repo's calls, not
      // on real transactional isolation.
      transaction: jest.fn((cb) => cb({ getRepository: () => recordsRepo })),
    };
    recordsRepo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) =>
        Promise.resolve(Array.isArray(x) ? x : { id: 'rec-1', ...x }),
      ),
      findOne: jest.fn(),
      findBy: jest.fn(),
      delete: jest.fn(),
    };
    nodesRepo = { findOne: jest.fn() };
    studentsRepo = { exists: jest.fn(), find: jest.fn() };
    enrollmentsRepo = { exists: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonRecordsService,
        { provide: getRepositoryToken(LessonRecord), useValue: recordsRepo },
        { provide: getRepositoryToken(CurriculumNode), useValue: nodesRepo },
        { provide: getRepositoryToken(Student), useValue: studentsRepo },
        {
          provide: getRepositoryToken(SchoolClassEnrollment),
          useValue: enrollmentsRepo,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<LessonRecordsService>(LessonRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const input = {
      studentId: 'stu-1',
      lessonId: 'les-1',
      recordedAt: '2026-05-16',
      status: LessonRecordStatus.INTRODUCED,
    };

    it('rejects when lesson is not found in this org (multi-tenant isolation)', async () => {
      nodesRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(input, 'org-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(nodesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'les-1', organizationId: 'org-1' },
        select: ['id', 'nodeType'],
      });
    });

    it('rejects when curriculum node is not of type LESSON', async () => {
      nodesRepo.findOne.mockResolvedValue({
        id: 'les-1',
        nodeType: CurriculumNodeType.GROUP,
      });
      studentsRepo.exists.mockResolvedValue(true);
      await expect(
        service.create(input, 'org-1', 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when student is not found in this org', async () => {
      nodesRepo.findOne.mockResolvedValue({
        id: 'les-1',
        nodeType: CurriculumNodeType.LESSON,
      });
      studentsRepo.exists.mockResolvedValue(false);
      await expect(
        service.create(input, 'org-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('writes record with org + recorded_by when validation passes', async () => {
      nodesRepo.findOne.mockResolvedValue({
        id: 'les-1',
        nodeType: CurriculumNodeType.LESSON,
      });
      studentsRepo.exists.mockResolvedValue(true);

      const result = await service.create(input, 'org-1', 'user-9');

      expect(recordsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          recordedById: 'user-9',
          studentId: 'stu-1',
          lessonId: 'les-1',
          status: LessonRecordStatus.INTRODUCED,
        }),
      );
      expect(result.id).toBe('rec-1');
    });

    it('persists observation badges when provided', async () => {
      nodesRepo.findOne.mockResolvedValue({
        id: 'les-1',
        nodeType: CurriculumNodeType.LESSON,
      });
      studentsRepo.exists.mockResolvedValue(true);

      await service.create(
        {
          ...input,
          observation: {
            engagement: LessonRecordEngagement.FOCUSED,
            difficulty: LessonRecordDifficulty.JUST_RIGHT,
            socialForm: LessonRecordSocialForm.WITH_PARTNER,
            selfAssessment: LessonRecordSelfAssessment.UNDERSTOOD,
            selfAssessmentByChild: true,
            lessonClarityConfirmed: true,
          },
        },
        'org-1',
        'user-9',
      );

      expect(recordsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          engagement: LessonRecordEngagement.FOCUSED,
          difficulty: LessonRecordDifficulty.JUST_RIGHT,
          socialForm: LessonRecordSocialForm.WITH_PARTNER,
          selfAssessment: LessonRecordSelfAssessment.UNDERSTOOD,
          selfAssessmentByChild: true,
          lessonClarityConfirmed: true,
        }),
      );
    });

    it('rejects selfAssessmentByChild=true without selfAssessment', async () => {
      nodesRepo.findOne.mockResolvedValue({
        id: 'les-1',
        nodeType: CurriculumNodeType.LESSON,
      });
      studentsRepo.exists.mockResolvedValue(true);

      await expect(
        service.create(
          {
            ...input,
            observation: {
              selfAssessmentByChild: true,
            },
          },
          'org-1',
          'user-9',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('leaves observation fields null when input.observation is omitted', async () => {
      nodesRepo.findOne.mockResolvedValue({
        id: 'les-1',
        nodeType: CurriculumNodeType.LESSON,
      });
      studentsRepo.exists.mockResolvedValue(true);

      await service.create(input, 'org-1', 'user-9');

      const created = recordsRepo.create.mock.calls[0][0];
      expect(created).not.toHaveProperty('engagement');
      expect(created).not.toHaveProperty('difficulty');
    });
  });

  describe('update observation patch', () => {
    const existing = {
      id: 'rec-1',
      organizationId: 'org-1',
      engagement: LessonRecordEngagement.FOCUSED,
      difficulty: LessonRecordDifficulty.JUST_RIGHT,
      socialForm: LessonRecordSocialForm.ALONE,
      selfAssessment: LessonRecordSelfAssessment.UNDERSTOOD,
      selfAssessmentByChild: true,
      lessonClarityConfirmed: true,
    };

    it('patches only the fields present in observation', async () => {
      recordsRepo.findOne.mockResolvedValue({ ...existing });

      await service.update(
        {
          id: 'rec-1',
          observation: { difficulty: LessonRecordDifficulty.TOO_HARD },
        },
        'org-1',
      );

      expect(recordsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          difficulty: LessonRecordDifficulty.TOO_HARD,
          engagement: LessonRecordEngagement.FOCUSED,
          selfAssessment: LessonRecordSelfAssessment.UNDERSTOOD,
        }),
      );
    });

    it('clears all observation fields when observation=null', async () => {
      recordsRepo.findOne.mockResolvedValue({ ...existing });

      await service.update({ id: 'rec-1', observation: null }, 'org-1');

      expect(recordsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          engagement: null,
          difficulty: null,
          socialForm: null,
          selfAssessment: null,
          selfAssessmentByChild: false,
          lessonClarityConfirmed: null,
        }),
      );
    });

    it('rejects patch that would leave selfAssessmentByChild=true without selfAssessment', async () => {
      recordsRepo.findOne.mockResolvedValue({ ...existing });

      await expect(
        service.update(
          {
            id: 'rec-1',
            observation: { selfAssessment: null },
          },
          'org-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('durationMinutes', () => {
    beforeEach(() => {
      nodesRepo.findOne.mockResolvedValue({
        id: 'les-1',
        nodeType: CurriculumNodeType.LESSON,
      });
      studentsRepo.exists.mockResolvedValue(true);
    });

    const input = {
      studentId: 'stu-1',
      lessonId: 'les-1',
      recordedAt: '2026-05-16',
      status: LessonRecordStatus.INTRODUCED,
    };

    it('persists the duration on create', async () => {
      await service.create({ ...input, durationMinutes: 45 }, 'org-1', 'u-1');
      expect(recordsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ durationMinutes: 45 }),
      );
    });

    it('stores null when no duration was given', async () => {
      await service.create(input, 'org-1', 'u-1');
      expect(recordsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ durationMinutes: null }),
      );
    });

    it('updates the duration and clears it on explicit null', async () => {
      recordsRepo.findOne.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        durationMinutes: 30,
      });
      await service.update({ id: 'rec-1', durationMinutes: 60 }, 'org-1');
      expect(recordsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ durationMinutes: 60 }),
      );

      recordsRepo.findOne.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        durationMinutes: 30,
      });
      await service.update({ id: 'rec-1', durationMinutes: null }, 'org-1');
      expect(recordsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ durationMinutes: null }),
      );
    });

    it('leaves an existing duration untouched when the field is absent', async () => {
      recordsRepo.findOne.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        durationMinutes: 30,
      });
      await service.update({ id: 'rec-1', note: 'x' }, 'org-1');
      expect(recordsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ durationMinutes: 30 }),
      );
    });
  });

  describe('getRecentLessonRecords', () => {
    const row = (over: Partial<Record<string, unknown>> = {}) => ({
      lesson_id: 'les-1',
      recorded_at: '2026-05-16',
      student_count: 3,
      status: LessonRecordStatus.PRACTICED,
      duration_minutes: 20,
      students: [{ id: 'stu-1', firstName: 'Anna', lastName: 'Muster' }],
      record_ids: ['rec-1', 'rec-2', 'rec-3'],
      lesson_name: 'Goldenes Perlenmaterial',
      area_name: 'Mathematik',
      ...over,
    });

    it('scopes the query to the org AND the calling user', async () => {
      dataSource.query.mockResolvedValue([]);
      await service.getRecentLessonRecords('org-1', 'user-7');

      const [, params] = dataSource.query.mock.calls[0];
      expect(params[0]).toBe('org-1');
      expect(params[1]).toBe('user-7');
      const sql = dataSource.query.mock.calls[0][0] as string;
      expect(sql).toContain('lr.organization_id = $1');
      expect(sql).toContain('lr.recorded_by_id = $2');
    });

    it('groups by lesson x recordedAt so a bulk entry is one row', async () => {
      dataSource.query.mockResolvedValue([]);
      await service.getRecentLessonRecords('org-1', 'user-7');
      const sql = dataSource.query.mock.calls[0][0] as string;
      expect(sql).toContain('GROUP BY lr.lesson_id, lr.recorded_at');
      expect(sql).toContain('COUNT(DISTINCT lr.student_id)');
    });

    it('sorts by recordedAt DESC then createdAt DESC', async () => {
      dataSource.query.mockResolvedValue([]);
      await service.getRecentLessonRecords('org-1', 'user-7');
      const sql = dataSource.query.mock.calls[0][0] as string;
      expect(sql).toContain(
        'ORDER BY g.recorded_at DESC, g.last_created_at DESC',
      );
    });

    it('defaults the limit to 5', async () => {
      dataSource.query.mockResolvedValue([]);
      await service.getRecentLessonRecords('org-1', 'user-7');
      expect(dataSource.query.mock.calls[0][1][2]).toBe(5);
    });

    it('clamps an oversized limit to the hard cap', async () => {
      dataSource.query.mockResolvedValue([]);
      await service.getRecentLessonRecords('org-1', 'user-7', 10_000);
      expect(dataSource.query.mock.calls[0][1][2]).toBe(50);
    });

    it('falls back to the default for a meaningless limit', async () => {
      for (const bad of [0, -3, NaN]) {
        dataSource.query.mockClear();
        dataSource.query.mockResolvedValue([]);
        await service.getRecentLessonRecords('org-1', 'user-7', bad);
        expect(dataSource.query.mock.calls[0][1][2]).toBe(5);
      }
    });

    it('passes the locale uppercased for the translation fallback', async () => {
      dataSource.query.mockResolvedValue([]);
      await service.getRecentLessonRecords('org-1', 'user-7', 5, 'en');
      expect(dataSource.query.mock.calls[0][1][3]).toBe('EN');
    });

    it('maps rows to the output shape with a numeric studentCount', async () => {
      dataSource.query.mockResolvedValue([
        row(),
        row({
          lesson_id: 'les-2',
          recorded_at: '2026-05-15',
          student_count: '1',
          area_name: null,
        }),
      ]);

      const result = await service.getRecentLessonRecords('org-1', 'user-7');

      expect(result).toEqual([
        {
          lessonId: 'les-1',
          recordedAt: '2026-05-16',
          studentCount: 3,
          status: LessonRecordStatus.PRACTICED,
          durationMinutes: 20,
          students: [{ id: 'stu-1', firstName: 'Anna', lastName: 'Muster' }],
          recordIds: ['rec-1', 'rec-2', 'rec-3'],
          lessonName: 'Goldenes Perlenmaterial',
          areaName: 'Mathematik',
        },
        {
          lessonId: 'les-2',
          recordedAt: '2026-05-15',
          studentCount: 1,
          status: LessonRecordStatus.PRACTICED,
          durationMinutes: 20,
          students: [{ id: 'stu-1', firstName: 'Anna', lastName: 'Muster' }],
          recordIds: ['rec-1', 'rec-2', 'rec-3'],
          lessonName: 'Goldenes Perlenmaterial',
          areaName: null,
        },
      ]);
    });
  });

  describe('updateGroup', () => {
    const baseInput = {
      recordIds: ['rec-1', 'rec-2'],
      lessonId: 'les-1',
      recordedAt: '2026-05-16',
    };

    it('updates status/duration in place when studentIds is omitted', async () => {
      recordsRepo.findBy.mockResolvedValue([
        {
          id: 'rec-1',
          studentId: 'stu-1',
          status: LessonRecordStatus.INTRODUCED,
        },
        {
          id: 'rec-2',
          studentId: 'stu-2',
          status: LessonRecordStatus.INTRODUCED,
        },
      ]);

      await service.updateGroup(
        { ...baseInput, status: LessonRecordStatus.PRACTICED },
        'org-1',
        'user-9',
      );

      expect(recordsRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'rec-1',
          status: LessonRecordStatus.PRACTICED,
        }),
        expect.objectContaining({
          id: 'rec-2',
          status: LessonRecordStatus.PRACTICED,
        }),
      ]);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('removes records for students dropped from studentIds', async () => {
      recordsRepo.findBy.mockResolvedValue([
        {
          id: 'rec-1',
          studentId: 'stu-1',
          status: LessonRecordStatus.INTRODUCED,
        },
        {
          id: 'rec-2',
          studentId: 'stu-2',
          status: LessonRecordStatus.INTRODUCED,
        },
      ]);

      await service.updateGroup(
        { ...baseInput, studentIds: ['stu-1'] },
        'org-1',
        'user-9',
      );

      expect(recordsRepo.delete).toHaveBeenCalledWith({
        id: expect.anything(),
      });
    });

    it('adds records for newly-added students after validating org membership', async () => {
      recordsRepo.findBy.mockResolvedValue([
        {
          id: 'rec-1',
          studentId: 'stu-1',
          status: LessonRecordStatus.PRACTICED,
          note: 'note',
          durationMinutes: 15,
        },
      ]);
      studentsRepo.find.mockResolvedValue([{ id: 'stu-2' }]);

      await service.updateGroup(
        { ...baseInput, recordIds: ['rec-1'], studentIds: ['stu-1', 'stu-2'] },
        'org-1',
        'user-9',
      );

      expect(studentsRepo.find).toHaveBeenCalledWith({
        where: { id: expect.anything(), organizationId: 'org-1' },
        select: ['id'],
      });
      expect(recordsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'stu-2',
          lessonId: 'les-1',
          recordedAt: '2026-05-16',
          status: LessonRecordStatus.PRACTICED,
          recordedById: 'user-9',
          organizationId: 'org-1',
        }),
      );
    });

    it('rejects when an added student is not found in this organization', async () => {
      recordsRepo.findBy.mockResolvedValue([
        {
          id: 'rec-1',
          studentId: 'stu-1',
          status: LessonRecordStatus.INTRODUCED,
        },
      ]);
      studentsRepo.find.mockResolvedValue([]);

      await expect(
        service.updateGroup(
          {
            ...baseInput,
            recordIds: ['rec-1'],
            studentIds: ['stu-1', 'stu-2'],
          },
          'org-1',
          'user-9',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteGroup', () => {
    it('deletes all records matching the given ids, scoped to the org', async () => {
      recordsRepo.delete.mockResolvedValue({ affected: 2 });

      const result = await service.deleteGroup(['rec-1', 'rec-2'], 'org-1');

      expect(recordsRepo.delete).toHaveBeenCalledWith({
        id: expect.anything(),
        organizationId: 'org-1',
      });
      expect(result).toBe(true);
    });
  });
});
