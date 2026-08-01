import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { LessonRecordAttachment } from './entities/lesson-record-attachment.entity';
import { LessonRecord } from './entities/lesson-record.entity';
import { LessonRecordAttachmentsService } from './lesson-record-attachments.service';

describe('LessonRecordAttachmentsService', () => {
  let service: LessonRecordAttachmentsService;
  let attachmentsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
  };
  let recordsRepo: { exists: jest.Mock };

  beforeEach(async () => {
    attachmentsRepo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'att-1', ...x })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    recordsRepo = { exists: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonRecordAttachmentsService,
        {
          provide: getRepositoryToken(LessonRecordAttachment),
          useValue: attachmentsRepo,
        },
        { provide: getRepositoryToken(LessonRecord), useValue: recordsRepo },
      ],
    }).compile();

    service = module.get(LessonRecordAttachmentsService);
  });

  describe('assertRecordInOrg', () => {
    it('passes for a record in the caller org', async () => {
      recordsRepo.exists.mockResolvedValue(true);
      await expect(
        service.assertRecordInOrg('rec-1', 'org-1'),
      ).resolves.toBeUndefined();
      expect(recordsRepo.exists).toHaveBeenCalledWith({
        where: { id: 'rec-1', organizationId: 'org-1' },
      });
    });

    it('rejects a record belonging to another org (multi-tenant isolation)', async () => {
      recordsRepo.exists.mockResolvedValue(false);
      await expect(
        service.assertRecordInOrg('rec-1', 'org-2'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('create', () => {
    it('persists the metadata including the org and uploader', async () => {
      const result = await service.create({
        lessonRecordId: 'rec-1',
        organizationId: 'org-1',
        storageKey: 'lesson-records/org-1/abc.png',
        fileName: 'work.png',
        mimeType: 'image/png',
        sizeBytes: 1234,
        uploadedById: 'user-9',
      });

      expect(attachmentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          lessonRecordId: 'rec-1',
          uploadedById: 'user-9',
          storageKey: 'lesson-records/org-1/abc.png',
        }),
      );
      expect(result.id).toBe('att-1');
    });
  });

  describe('findOneOwned', () => {
    it('always filters by organization', async () => {
      attachmentsRepo.findOne.mockResolvedValue({ id: 'att-1' });
      await service.findOneOwned('att-1', 'org-1');
      expect(attachmentsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'att-1', organizationId: 'org-1' },
      });
    });

    it('throws NotFound for an attachment of another org', async () => {
      attachmentsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findOneOwned('att-1', 'org-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findByRecord', () => {
    it('scopes to record AND org, oldest first', async () => {
      await service.findByRecord('rec-1', 'org-1');
      expect(attachmentsRepo.find).toHaveBeenCalledWith({
        where: { lessonRecordId: 'rec-1', organizationId: 'org-1' },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('remove', () => {
    it('puts the org into the DELETE itself', async () => {
      await service.remove('att-1', 'org-1');
      expect(attachmentsRepo.delete).toHaveBeenCalledWith({
        id: 'att-1',
        organizationId: 'org-1',
      });
    });
  });
});
