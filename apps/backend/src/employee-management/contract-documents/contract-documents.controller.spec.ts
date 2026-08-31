import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { EntityManager } from 'typeorm';

import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { StorageService } from '@/storage/storage.service';
import { ContractDocumentsController } from './contract-documents.controller';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ORG_ID = '22222222-2222-4222-8222-222222222222';
const EMPLOYEE_ID = '33333333-3333-4333-8333-333333333333';
const FILE_ID = '44444444-4444-4444-8444-444444444444';

const orgAdmin = {
  sub: 'user-1',
  orgId: ORG_ID,
  roles: [SystemRole.ORG_ADMIN],
  permissions: [],
  isSuperAdmin: false,
} as unknown as TokenPayload;

const superAdmin = {
  sub: 'user-sa',
  orgId: ORG_ID,
  roles: [],
  permissions: [],
  isSuperAdmin: true,
} as unknown as TokenPayload;

const pdfFile = {
  buffer: Buffer.from('%PDF-1.4'),
  mimetype: 'application/pdf',
} as Express.Multer.File;

describe('ContractDocumentsController', () => {
  let controller: ContractDocumentsController;
  let storage: { put: jest.Mock; getStream: jest.Mock; delete: jest.Mock };
  let entityManager: { findOne: jest.Mock };

  beforeEach(() => {
    storage = {
      put: jest.fn().mockResolvedValue(undefined),
      getStream: jest
        .fn()
        .mockResolvedValue({ stream: Readable.from(['%PDF']) }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    entityManager = { findOne: jest.fn() };
    controller = new ContractDocumentsController(
      entityManager as unknown as EntityManager,
      storage as unknown as StorageService,
    );
    jest.clearAllMocks();
  });

  describe('security metadata', () => {
    it('requires BetterAuthGuard on the controller', () => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', ContractDocumentsController) ?? [];
      expect(guards).toContain(BetterAuthGuard);
    });

    it('restricts the controller to org owner and org admin', () => {
      const roles: SystemRole[] =
        Reflect.getMetadata(ROLES_KEY, ContractDocumentsController) ?? [];
      expect(roles).toEqual(
        expect.arrayContaining([SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN]),
      );
    });
  });

  describe('upload', () => {
    beforeEach(() => {
      entityManager.findOne.mockResolvedValue({ id: EMPLOYEE_ID });
    });

    it('stores the PDF under an org-scoped key and returns its URL', async () => {
      const result = await controller.upload(pdfFile, EMPLOYEE_ID, orgAdmin);

      expect(result.url).toBe(`/api/contract-documents/${result.fileId}`);
      expect(storage.put).toHaveBeenCalledWith(
        `contracts/${ORG_ID}/${result.fileId}.pdf`,
        pdfFile.buffer,
        'application/pdf',
      );
    });

    it('rejects anything that is not a PDF', async () => {
      const image = {
        buffer: Buffer.from('fake'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      await expect(
        controller.upload(image, EMPLOYEE_ID, orgAdmin),
      ).rejects.toThrow(BadRequestException);
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('rejects a request without a file', async () => {
      await expect(
        controller.upload(
          undefined as unknown as Express.Multer.File,
          EMPLOYEE_ID,
          orgAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a caller without an active organization', async () => {
      const noOrg = { ...orgAdmin, orgId: undefined } as TokenPayload;

      await expect(
        controller.upload(pdfFile, EMPLOYEE_ID, noOrg),
      ).rejects.toThrow(ForbiddenException);
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('rejects a missing employeeId', async () => {
      await expect(controller.upload(pdfFile, '', orgAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('multi-tenant isolation: rejects an employee of a foreign organization', async () => {
      // The org-scoped lookup finds nothing -> the employee is not ours.
      entityManager.findOne.mockResolvedValue(null);

      await expect(
        controller.upload(pdfFile, EMPLOYEE_ID, orgAdmin),
      ).rejects.toThrow(ForbiddenException);
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('scopes the ownership lookup to the active organization', async () => {
      await controller.upload(pdfFile, EMPLOYEE_ID, orgAdmin);

      expect(entityManager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: {
            id: EMPLOYEE_ID,
            membership: { organizationId: ORG_ID },
          },
        }),
      );
    });

    it('lets SuperAdmin skip the org-membership lookup', async () => {
      await controller.upload(pdfFile, EMPLOYEE_ID, superAdmin);

      expect(entityManager.findOne).not.toHaveBeenCalled();
      expect(storage.put).toHaveBeenCalled();
    });
  });

  describe('regression: opaque 500s', () => {
    it('rejects a non-UUID employeeId instead of letting Postgres reject the cast', async () => {
      // TypeORM passed the value straight through, so Postgres answered
      // "invalid input syntax for type uuid" and the caller saw a bare 500.
      await expect(
        controller.upload(pdfFile, 'not-a-uuid', orgAdmin),
      ).rejects.toThrow(BadRequestException);
      expect(entityManager.findOne).not.toHaveBeenCalled();
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('reports a storage outage as 503, not "Internal server error"', async () => {
      // The container's root filesystem is read-only, so an unconfigured
      // bucket makes the local fallback throw EROFS mid-request.
      entityManager.findOne.mockResolvedValue({ id: EMPLOYEE_ID });
      storage.put.mockRejectedValue(
        Object.assign(new Error('EROFS: read-only file system'), {
          code: 'EROFS',
        }),
      );

      await expect(
        controller.upload(pdfFile, EMPLOYEE_ID, orgAdmin),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('reports a storage outage on delete as 503', async () => {
      storage.delete.mockRejectedValue(new Error('bucket unreachable'));

      await expect(controller.remove(FILE_ID, orgAdmin)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('download', () => {
    it('reads from the caller org key, never from another org', async () => {
      await controller.download(FILE_ID, orgAdmin);

      expect(storage.getStream).toHaveBeenCalledWith(
        `contracts/${ORG_ID}/${FILE_ID}.pdf`,
      );
      expect(storage.getStream).not.toHaveBeenCalledWith(
        `contracts/${OTHER_ORG_ID}/${FILE_ID}.pdf`,
      );
    });

    it('rejects a caller without an active organization', async () => {
      const noOrg = { ...orgAdmin, orgId: undefined } as TokenPayload;

      await expect(controller.download(FILE_ID, noOrg)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('answers 404 for a document that does not exist', async () => {
      storage.getStream.mockRejectedValue(new Error('ENOENT'));

      await expect(controller.download(FILE_ID, orgAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes under the caller org key', async () => {
      await expect(controller.remove(FILE_ID, orgAdmin)).resolves.toEqual({
        success: true,
      });
      expect(storage.delete).toHaveBeenCalledWith(
        `contracts/${ORG_ID}/${FILE_ID}.pdf`,
      );
    });

    it('rejects a caller without an active organization', async () => {
      const noOrg = { ...orgAdmin, orgId: undefined } as TokenPayload;

      await expect(controller.remove(FILE_ID, noOrg)).rejects.toThrow(
        ForbiddenException,
      );
      expect(storage.delete).not.toHaveBeenCalled();
    });
  });
});
