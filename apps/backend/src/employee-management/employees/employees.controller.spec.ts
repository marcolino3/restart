import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeesController } from './employees.controller';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

const orgUser = {
  sub: 'user-1',
  orgId: ORG_ID,
  isSuperAdmin: false,
} as unknown as TokenPayload;

const csvFile = (name = 'employees.csv') =>
  ({
    buffer: Buffer.from('email\na@x.ch'),
    mimetype: 'text/csv',
    originalname: name,
  }) as Express.Multer.File;

describe('EmployeesController', () => {
  const importService = { importFile: jest.fn() };
  const controller = new EmployeesController(importService as never);

  beforeEach(() => jest.clearAllMocks());

  describe('security metadata', () => {
    it('requires BetterAuthGuard on the controller', () => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', EmployeesController) ?? [];
      expect(guards).toContain(BetterAuthGuard);
    });

    it('requires EMPLOYEE_WRITE on upload', () => {
      const perms: string[] =
        Reflect.getMetadata(
          PERMS_KEY,
          Object.getOwnPropertyDescriptor(
            EmployeesController.prototype,
            'upload',
          )?.value as object,
        ) ?? [];
      expect(perms).toContain('EMPLOYEE_WRITE');
    });
  });

  describe('upload', () => {
    it('rejects a missing file', async () => {
      await expect(
        controller.upload(undefined as never, orgUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a user without active organization', async () => {
      await expect(
        controller.upload(csvFile(), { ...orgUser, orgId: undefined }),
      ).rejects.toThrow(new BadRequestException('No organization selected'));
      expect(importService.importFile).not.toHaveBeenCalled();
    });

    it('rejects unsupported file types', async () => {
      await expect(
        controller.upload(csvFile('employees.pdf'), orgUser),
      ).rejects.toThrow(/Unsupported file type/);
    });

    it('delegates to the import service with the actor org', async () => {
      importService.importFile.mockResolvedValue({ created: [], failed: [] });
      await controller.upload(csvFile('Mitarbeiter.XLSX'), orgUser);
      expect(importService.importFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'mitarbeiter.xlsx',
        ORG_ID,
        orgUser,
      );
    });

    it('passes through HTTP exceptions such as field-permission denials', async () => {
      importService.importFile.mockRejectedValue(
        new ForbiddenException('Access denied for columns: iban'),
      );
      await expect(controller.upload(csvFile(), orgUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('wraps parser errors into a 400', async () => {
      importService.importFile.mockRejectedValue(new Error('corrupt zip'));
      await expect(controller.upload(csvFile(), orgUser)).rejects.toThrow(
        new BadRequestException('corrupt zip'),
      );
    });
  });
});
