import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Readable } from 'stream';

import { LessonRecordAttachmentsController } from './lesson-record-attachments.controller';
import type { LessonRecordAttachmentsService } from './lesson-record-attachments.service';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import type { StorageService } from '@/storage/storage.service';

const user = (over: Partial<TokenPayload> = {}): TokenPayload => ({
  orgId: 'org-a',
  sub: 'user-9',
  ...over,
});

const png = (): Express.Multer.File =>
  ({
    mimetype: 'image/png',
    buffer: Buffer.from('fake-png'),
    originalname: 'work.png',
    size: 8,
  }) as Express.Multer.File;

describe('LessonRecordAttachmentsController', () => {
  let controller: LessonRecordAttachmentsController;
  let attachments: {
    assertRecordInOrg: jest.Mock;
    create: jest.Mock;
    findByRecord: jest.Mock;
    findOneOwned: jest.Mock;
    remove: jest.Mock;
  };
  let storage: { put: jest.Mock; getStream: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    attachments = {
      assertRecordInOrg: jest.fn().mockResolvedValue(undefined),
      create: jest
        .fn()
        .mockResolvedValue({ id: 'att-1', fileName: 'work.png' }),
      findByRecord: jest.fn().mockResolvedValue([]),
      findOneOwned: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    storage = { put: jest.fn(), getStream: jest.fn(), delete: jest.fn() };

    controller = new LessonRecordAttachmentsController(
      attachments as unknown as LessonRecordAttachmentsService,
      storage as unknown as StorageService,
    );
  });

  describe('upload', () => {
    it('rejects a disallowed mime type', async () => {
      const file = { ...png(), mimetype: 'application/zip' };
      await expect(
        controller.upload(file, 'rec-1', user()),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('rejects when there is no active organization', async () => {
      await expect(
        controller.upload(png(), 'rec-1', user({ orgId: undefined })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when lessonRecordId is missing', async () => {
      await expect(controller.upload(png(), '', user())).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when the target record belongs to another org (multi-tenant isolation)', async () => {
      attachments.assertRecordInOrg.mockRejectedValue(
        new ForbiddenException('Record does not belong to this organization'),
      );

      await expect(
        controller.upload(png(), 'rec-1', user({ orgId: 'org-b' })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storage.put).not.toHaveBeenCalled();
      expect(attachments.create).not.toHaveBeenCalled();
    });

    it('stores under an org-scoped key and persists metadata for the caller org', async () => {
      storage.put.mockResolvedValue(undefined);

      const res = await controller.upload(png(), 'rec-1', user());

      expect(attachments.assertRecordInOrg).toHaveBeenCalledWith(
        'rec-1',
        'org-a',
      );
      expect(storage.put).toHaveBeenCalledWith(
        expect.stringMatching(/^lesson-records\/org-a\/[a-z0-9-]+\.png$/),
        expect.any(Buffer),
        'image/png',
      );
      expect(attachments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonRecordId: 'rec-1',
          organizationId: 'org-a',
          uploadedById: 'user-9',
          fileName: 'work.png',
          mimeType: 'image/png',
        }),
      );
      expect(res).toEqual({ id: 'att-1', fileName: 'work.png' });
    });
  });

  describe('list', () => {
    it('rejects when the target record belongs to another org (multi-tenant isolation)', async () => {
      attachments.assertRecordInOrg.mockRejectedValue(new ForbiddenException());
      await expect(
        controller.list('rec-1', user({ orgId: 'org-b' })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(attachments.findByRecord).not.toHaveBeenCalled();
    });

    it('scopes the listing to record + caller org and drops the storage key', async () => {
      attachments.findByRecord.mockResolvedValue([
        {
          id: 'att-1',
          fileName: 'work.png',
          mimeType: 'image/png',
          sizeBytes: 8,
          createdAt: new Date('2026-08-01'),
          storageKey: 'lesson-records/org-a/att-1.png',
        },
      ]);

      const res = await controller.list('rec-1', user());

      expect(attachments.findByRecord).toHaveBeenCalledWith('rec-1', 'org-a');
      expect(res[0]).not.toHaveProperty('storageKey');
    });
  });

  describe('download', () => {
    it('rejects an attachment id belonging to another org (multi-tenant isolation)', async () => {
      attachments.findOneOwned.mockRejectedValue(new NotFoundException());
      await expect(
        controller.download('att-1', user({ orgId: 'org-b' })),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.getStream).not.toHaveBeenCalled();
    });

    it('streams the object for an attachment owned by the caller org', async () => {
      attachments.findOneOwned.mockResolvedValue({
        id: 'att-1',
        storageKey: 'lesson-records/org-a/att-1.png',
        mimeType: 'image/png',
        fileName: 'work.png',
      });
      storage.getStream.mockResolvedValue({ stream: new Readable() });

      const result = await controller.download('att-1', user());

      expect(attachments.findOneOwned).toHaveBeenCalledWith('att-1', 'org-a');
      expect(storage.getStream).toHaveBeenCalledWith(
        'lesson-records/org-a/att-1.png',
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('maps a missing object to 404', async () => {
      attachments.findOneOwned.mockResolvedValue({
        id: 'att-1',
        storageKey: 'lesson-records/org-a/att-1.png',
        mimeType: 'image/png',
        fileName: 'work.png',
      });
      storage.getStream.mockRejectedValue(new Error('nope'));

      await expect(controller.download('att-1', user())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('rejects an attachment id belonging to another org (multi-tenant isolation)', async () => {
      attachments.findOneOwned.mockRejectedValue(new NotFoundException());
      await expect(
        controller.remove('att-1', user({ orgId: 'org-b' })),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.delete).not.toHaveBeenCalled();
      expect(attachments.remove).not.toHaveBeenCalled();
    });

    it('deletes the object and the metadata row scoped to the caller org', async () => {
      attachments.findOneOwned.mockResolvedValue({
        id: 'att-1',
        storageKey: 'lesson-records/org-a/att-1.png',
        mimeType: 'image/png',
        fileName: 'work.png',
      });

      const res = await controller.remove('att-1', user());

      expect(storage.delete).toHaveBeenCalledWith(
        'lesson-records/org-a/att-1.png',
      );
      expect(attachments.remove).toHaveBeenCalledWith('att-1', 'org-a');
      expect(res).toEqual({ success: true });
    });
  });
});
