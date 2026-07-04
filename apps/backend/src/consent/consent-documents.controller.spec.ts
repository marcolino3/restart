import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Readable } from 'stream';

import { ConsentDocumentsController } from './consent-documents.controller';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import type { StorageService } from '@/storage/storage.service';

const user = (over: Partial<TokenPayload> = {}): TokenPayload =>
  ({ orgId: 'org-a', ...over }) as TokenPayload;

const pdf = (): Express.Multer.File =>
  ({
    mimetype: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  }) as Express.Multer.File;

describe('ConsentDocumentsController', () => {
  let controller: ConsentDocumentsController;
  let storage: {
    put: jest.Mock;
    getStream: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    storage = { put: jest.fn(), getStream: jest.fn(), delete: jest.fn() };
    controller = new ConsentDocumentsController(
      storage as unknown as StorageService,
    );
  });

  describe('upload', () => {
    it('rejects a non-PDF file', async () => {
      const file = { ...pdf(), mimetype: 'image/png' };
      await expect(controller.upload(file, user())).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('rejects when there is no active organization', async () => {
      await expect(
        controller.upload(pdf(), user({ orgId: undefined })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('stores under an org-scoped key and returns an authenticated url', async () => {
      storage.put.mockResolvedValue(undefined);

      const res = await controller.upload(pdf(), user());

      expect(res.url).toBe(`/api/consent-documents/${res.fileId}`);
      expect(storage.put).toHaveBeenCalledWith(
        `consent-evidence/org-a/${res.fileId}.pdf`,
        expect.any(Buffer),
        'application/pdf',
      );
    });
  });

  describe('download', () => {
    it('scopes the key to the caller org (multi-tenant isolation)', async () => {
      storage.getStream.mockResolvedValue({ stream: new Readable() });

      const result = await controller.download(
        'file-1',
        user({ orgId: 'org-b' }),
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(storage.getStream).toHaveBeenCalledWith(
        'consent-evidence/org-b/file-1.pdf',
      );
    });

    it('maps a missing object to 404', async () => {
      storage.getStream.mockRejectedValue(new Error('nope'));
      await expect(
        controller.download('file-1', user()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the org-scoped object', async () => {
      storage.delete.mockResolvedValue(undefined);
      await controller.remove('file-1', user());
      expect(storage.delete).toHaveBeenCalledWith(
        'consent-evidence/org-a/file-1.pdf',
      );
    });
  });
});
