import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UploadController } from './upload.controller';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { StorageService } from '@/storage/storage.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

jest.mock('sharp', () => {
  const toBuffer = jest.fn().mockResolvedValue(Buffer.from('webp'));
  const webp = jest.fn(() => ({ toBuffer }));
  return { __esModule: true, default: jest.fn(() => ({ webp })) };
});

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

const orgAdmin = {
  sub: 'user-1',
  orgId: ORG_ID,
  roles: [SystemRole.ORG_ADMIN],
  permissions: [],
  isSuperAdmin: false,
} as unknown as TokenPayload;

const superAdmin = {
  sub: 'user-sa',
  roles: [],
  permissions: [],
  isSuperAdmin: true,
} as unknown as TokenPayload;

const pngFile = {
  buffer: Buffer.from('fake'),
  mimetype: 'image/png',
} as Express.Multer.File;

describe('UploadController', () => {
  let controller: UploadController;
  let storage: { put: jest.Mock; delete: jest.Mock };
  let entityManager: { findOne: jest.Mock };

  beforeEach(() => {
    storage = {
      put: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    entityManager = { findOne: jest.fn() };
    controller = new UploadController(
      entityManager as unknown as EntityManager,
      storage as unknown as StorageService,
    );
    jest.clearAllMocks();
  });

  describe('security metadata (regression: endpoint was completely unguarded)', () => {
    it('requires BetterAuthGuard on the controller', () => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', UploadController) ?? [];
      expect(guards).toContain(BetterAuthGuard);
    });

    it('requires ORG_OWNER/ORG_ADMIN roles', () => {
      const roles: SystemRole[] =
        Reflect.getMetadata(ROLES_KEY, UploadController) ?? [];
      expect(roles).toEqual(
        expect.arrayContaining([SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN]),
      );
    });
  });

  describe('upload', () => {
    it('rejects missing file', async () => {
      await expect(
        controller.upload(
          undefined as unknown as Express.Multer.File,
          'organizations',
          ORG_ID,
          orgAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects entities without an ownership rule', async () => {
      await expect(
        controller.upload(pngFile, 'students', ORG_ID, orgAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects path-traversal attempts via entity', async () => {
      await expect(
        controller.upload(pngFile, '../../etc', ORG_ID, orgAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('multi-tenant isolation: rejects upload targeting a foreign organization', async () => {
      await expect(
        controller.upload(pngFile, 'organizations', OTHER_ORG_ID, orgAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects non-image mime types', async () => {
      const evil = {
        buffer: Buffer.from('<script/>'),
        mimetype: 'text/html',
      } as Express.Multer.File;
      await expect(
        controller.upload(evil, 'organizations', ORG_ID, orgAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows an org admin to upload for the own organization', async () => {
      await expect(
        controller.upload(pngFile, 'organizations', ORG_ID, orgAdmin),
      ).resolves.toEqual({ url: `/organizations/${ORG_ID}.webp` });
    });

    it('allows SuperAdmin to upload for any organization', async () => {
      await expect(
        controller.upload(pngFile, 'organizations', OTHER_ORG_ID, superAdmin),
      ).resolves.toEqual({ url: `/organizations/${OTHER_ORG_ID}.webp` });
    });
  });

  describe('remove', () => {
    it('multi-tenant isolation: rejects delete targeting a foreign organization', async () => {
      await expect(
        controller.remove('organizations', OTHER_ORG_ID, orgAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows delete for the own organization', async () => {
      await expect(
        controller.remove('organizations', ORG_ID, orgAdmin),
      ).resolves.toEqual({ success: true });
    });
  });
});
