import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { CurriculumNode } from '../entities/curriculum-node.entity';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { LessonRecordStatus } from '../enums/lesson-record-status.enum';
import { LessonRecord } from './entities/lesson-record.entity';
import { LessonRecordsService } from './lesson-records.service';

describe('LessonRecordsService', () => {
  let service: LessonRecordsService;
  let recordsRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let nodesRepo: { findOne: jest.Mock };
  let studentsRepo: { exists: jest.Mock; find: jest.Mock };
  let enrollmentsRepo: { exists: jest.Mock };

  beforeEach(async () => {
    recordsRepo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'rec-1', ...x })),
      findOne: jest.fn(),
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
        { provide: DataSource, useValue: {} },
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
  });
});
