import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Readable } from 'stream';
import { EntityManager } from 'typeorm';

import { AbsenceCertificatesController } from './absence-certificates.controller';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import type { StorageService } from '@/storage/storage.service';
import type { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';

const user = (over: Partial<TokenPayload> = {}): TokenPayload =>
  ({ orgId: 'org-a', ...over }) as TokenPayload;

const pdf = (): Express.Multer.File =>
  ({
    mimetype: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  }) as Express.Multer.File;

describe('AbsenceCertificatesController', () => {
  let controller: AbsenceCertificatesController;
  let entityManager: { findOne: jest.Mock };
  let storage: {
    put: jest.Mock;
    getStream: jest.Mock;
    delete: jest.Mock;
  };
  let access: {
    assertCanManageAbsence: jest.Mock;
    assertCanViewEmployee: jest.Mock;
  };

  beforeEach(() => {
    entityManager = { findOne: jest.fn() };
    storage = { put: jest.fn(), getStream: jest.fn(), delete: jest.fn() };
    access = {
      assertCanManageAbsence: jest.fn().mockResolvedValue(undefined),
      assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AbsenceCertificatesController(
      entityManager as unknown as EntityManager,
      storage as unknown as StorageService,
      access as unknown as TimeTrackingAccessService,
    );
  });

  describe('upload', () => {
    it('rejects unsupported mime types', async () => {
      const file = { ...pdf(), mimetype: 'application/zip' };
      await expect(
        controller.upload(file, 'emp-1', user()),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('rejects when there is no active organization', async () => {
      await expect(
        controller.upload(pdf(), 'emp-1', user({ orgId: undefined })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('requires employeeId', async () => {
      await expect(controller.upload(pdf(), '', user())).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects employees outside the active organization', async () => {
      entityManager.findOne.mockResolvedValue(null);
      await expect(
        controller.upload(pdf(), 'emp-foreign', user()),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('enforces absence manage access', async () => {
      entityManager.findOne.mockResolvedValue({ id: 'emp-1' });
      access.assertCanManageAbsence.mockRejectedValue(
        new ForbiddenException('denied'),
      );
      await expect(
        controller.upload(pdf(), 'emp-1', user()),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('stores under an org-scoped key and returns an authenticated url', async () => {
      entityManager.findOne.mockResolvedValue({ id: 'emp-1' });
      storage.put.mockResolvedValue(undefined);

      const res = await controller.upload(pdf(), 'emp-1', user());

      expect(access.assertCanManageAbsence).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: 'org-a' }),
        'emp-1',
      );
      expect(res.url).toMatch(/^\/api\/absence-certificates\/.+\.pdf$/);
      expect(storage.put).toHaveBeenCalledWith(
        expect.stringMatching(/^absence-certificates\/org-a\/.+\.pdf$/),
        expect.any(Buffer),
        'application/pdf',
      );
    });

    it('skips employee org check for super admins but still checks manage access', async () => {
      storage.put.mockResolvedValue(undefined);

      await controller.upload(pdf(), 'emp-any', user({ isSuperAdmin: true }));

      expect(entityManager.findOne).not.toHaveBeenCalled();
      expect(access.assertCanManageAbsence).toHaveBeenCalled();
      expect(storage.put).toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('requires employeeId', async () => {
      await expect(
        controller.download('cert-1.pdf', '', user()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('enforces view access before streaming', async () => {
      entityManager.findOne.mockResolvedValue({ id: 'emp-1' });
      access.assertCanViewEmployee.mockRejectedValue(
        new ForbiddenException('denied'),
      );
      await expect(
        controller.download('cert-1.pdf', 'emp-1', user()),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storage.getStream).not.toHaveBeenCalled();
    });

    it('scopes the key to the caller org (multi-tenant isolation)', async () => {
      entityManager.findOne.mockResolvedValue({ id: 'emp-1' });
      storage.getStream.mockResolvedValue({ stream: new Readable() });

      const result = await controller.download(
        'cert-1.pdf',
        'emp-1',
        user({ orgId: 'org-b' }),
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(access.assertCanViewEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: 'org-b' }),
        'emp-1',
      );
      expect(storage.getStream).toHaveBeenCalledWith(
        'absence-certificates/org-b/cert-1.pdf',
      );
    });

    it('maps a missing object to 404', async () => {
      entityManager.findOne.mockResolvedValue({ id: 'emp-1' });
      storage.getStream.mockRejectedValue(new Error('nope'));
      await expect(
        controller.download('cert-1.pdf', 'emp-1', user()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('requires employeeId and manage access', async () => {
      await expect(
        controller.remove('cert-1.pdf', '', user()),
      ).rejects.toBeInstanceOf(BadRequestException);

      entityManager.findOne.mockResolvedValue({ id: 'emp-1' });
      access.assertCanManageAbsence.mockRejectedValue(
        new ForbiddenException('denied'),
      );
      await expect(
        controller.remove('cert-1.pdf', 'emp-1', user()),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storage.delete).not.toHaveBeenCalled();
    });

    it('deletes the org-scoped object', async () => {
      entityManager.findOne.mockResolvedValue({ id: 'emp-1' });
      storage.delete.mockResolvedValue(undefined);
      await controller.remove('cert-1.pdf', 'emp-1', user());
      expect(storage.delete).toHaveBeenCalledWith(
        'absence-certificates/org-a/cert-1.pdf',
      );
    });
  });
});
