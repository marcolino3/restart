import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { StudentsService } from '@/school-management/students/students.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { LessonRecordAttachmentsService } from './lesson-record-attachments.service';
import { LessonRecordsResolver } from './lesson-records.resolver';
import { LessonRecordsService } from './lesson-records.service';
import { RecordKeepingSettingsService } from './record-keeping-settings.service';

describe('LessonRecordsResolver', () => {
  let resolver: LessonRecordsResolver;
  let service: {
    findManyByIds: jest.Mock;
    updateGroup: jest.Mock;
    deleteGroup: jest.Mock;
  };
  let studentsService: { assertStudentVisibleToUser: jest.Mock };

  const orgId = 'org-1';
  const user = {
    sub: 'user-1',
    roles: [],
    isSuperAdmin: false,
  } as TokenPayload;

  beforeEach(async () => {
    service = {
      findManyByIds: jest.fn(),
      updateGroup: jest.fn().mockResolvedValue([]),
      deleteGroup: jest.fn().mockResolvedValue(true),
    };
    studentsService = {
      assertStudentVisibleToUser: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonRecordsResolver,
        { provide: LessonRecordsService, useValue: service },
        { provide: StudentsService, useValue: studentsService },
        { provide: RecordKeepingSettingsService, useValue: {} },
        { provide: LessonRecordAttachmentsService, useValue: {} },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<LessonRecordsResolver>(LessonRecordsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('lessonRecordsByIds', () => {
    it('checks visibility for every record student before returning', async () => {
      const records = [
        { id: 'rec-1', studentId: 'stu-1' },
        { id: 'rec-2', studentId: 'stu-2' },
      ];
      service.findManyByIds.mockResolvedValue(records);

      const result = await resolver.findManyByIds(
        ['rec-1', 'rec-2'],
        orgId,
        user,
      );

      expect(service.findManyByIds).toHaveBeenCalledWith(
        ['rec-1', 'rec-2'],
        orgId,
      );
      expect(studentsService.assertStudentVisibleToUser).toHaveBeenCalledTimes(
        2,
      );
      expect(studentsService.assertStudentVisibleToUser).toHaveBeenCalledWith(
        'stu-1',
        user.sub,
        [],
        false,
        orgId,
      );
      expect(result).toBe(records);
    });

    it('propagates the visibility guard rejection (multi-tenant isolation)', async () => {
      service.findManyByIds.mockResolvedValue([
        { id: 'rec-1', studentId: 'stu-foreign' },
      ]);
      studentsService.assertStudentVisibleToUser.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        resolver.findManyByIds(['rec-1'], orgId, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateLessonRecordsGroup', () => {
    const baseInput = {
      recordIds: ['rec-1'],
      lessonId: 'les-1',
      recordedAt: '2026-05-16',
    };

    it('validates visibility for existing records and delegates to the service', async () => {
      service.findManyByIds.mockResolvedValue([
        { id: 'rec-1', studentId: 'stu-1' },
      ]);

      await resolver.updateLessonRecordsGroup(baseInput, orgId, user);

      expect(studentsService.assertStudentVisibleToUser).toHaveBeenCalledWith(
        'stu-1',
        user.sub,
        [],
        false,
        orgId,
      );
      expect(service.updateGroup).toHaveBeenCalledWith(
        baseInput,
        orgId,
        user.sub,
      );
    });

    it('also validates newly-added studentIds not already in the group', async () => {
      service.findManyByIds.mockResolvedValue([
        { id: 'rec-1', studentId: 'stu-1' },
      ]);

      await resolver.updateLessonRecordsGroup(
        { ...baseInput, studentIds: ['stu-1', 'stu-2'] },
        orgId,
        user,
      );

      expect(studentsService.assertStudentVisibleToUser).toHaveBeenCalledWith(
        'stu-2',
        user.sub,
        [],
        false,
        orgId,
      );
    });

    it('rejects when an existing record student is not visible to the caller (multi-tenant isolation)', async () => {
      service.findManyByIds.mockResolvedValue([
        { id: 'rec-1', studentId: 'stu-foreign' },
      ]);
      studentsService.assertStudentVisibleToUser.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        resolver.updateLessonRecordsGroup(baseInput, orgId, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.updateGroup).not.toHaveBeenCalled();
    });
  });

  describe('deleteLessonRecordsGroup', () => {
    it('validates visibility for every record before deleting', async () => {
      service.findManyByIds.mockResolvedValue([
        { id: 'rec-1', studentId: 'stu-1' },
        { id: 'rec-2', studentId: 'stu-2' },
      ]);

      const result = await resolver.deleteLessonRecordsGroup(
        ['rec-1', 'rec-2'],
        orgId,
        user,
      );

      expect(studentsService.assertStudentVisibleToUser).toHaveBeenCalledTimes(
        2,
      );
      expect(service.deleteGroup).toHaveBeenCalledWith(
        ['rec-1', 'rec-2'],
        orgId,
      );
      expect(result).toBe(true);
    });

    it('rejects and skips deletion when a record belongs to a student outside the caller org (multi-tenant isolation)', async () => {
      service.findManyByIds.mockResolvedValue([
        { id: 'rec-1', studentId: 'stu-foreign' },
      ]);
      studentsService.assertStudentVisibleToUser.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        resolver.deleteLessonRecordsGroup(['rec-1'], orgId, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(service.deleteGroup).not.toHaveBeenCalled();
    });
  });
});
