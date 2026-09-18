import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { ClassBudgetAccessService } from './class-budget-access.service';
import { ClassExpense } from './entities/class-expense.entity';
import { ExpenseReceiptsController } from './expense-receipts.controller';
import { ExpenseReceiptsService } from './expense-receipts.service';

const ORG = '11111111-1111-4111-8111-111111111111';
const CLASS = '22222222-2222-4222-8222-222222222222';
const FILE = '33333333-3333-4333-8333-333333333333.pdf';

describe('ExpenseReceiptsController', () => {
  let controller: ExpenseReceiptsController;
  let expensesRepo: { exists: jest.Mock };
  let receipts: {
    put: jest.Mock;
    stream: jest.Mock;
    delete: jest.Mock;
    mimeOf: jest.Mock;
  };
  let access: { assertSchoolClassAccessible: jest.Mock };

  const user: TokenPayload = { sub: 'user-1', orgId: ORG, roles: ['EMPLOYEE'] };
  const file = {
    buffer: Buffer.from('%PDF'),
    mimetype: 'application/pdf',
  } as Express.Multer.File;

  beforeEach(() => {
    expensesRepo = { exists: jest.fn().mockResolvedValue(false) };
    receipts = {
      put: jest.fn().mockResolvedValue(FILE),
      stream: jest.fn().mockResolvedValue(Readable.from(Buffer.from('%PDF'))),
      delete: jest.fn().mockResolvedValue(undefined),
      mimeOf: jest.fn().mockReturnValue('application/pdf'),
    };
    access = {
      assertSchoolClassAccessible: jest.fn().mockResolvedValue(undefined),
    };
    controller = new ExpenseReceiptsController(
      expensesRepo as unknown as Repository<ClassExpense>,
      receipts as unknown as ExpenseReceiptsService,
      access as unknown as ClassBudgetAccessService,
    );
  });

  it('is authenticated and permission-gated on every route', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', ExpenseReceiptsController) ?? [];
    expect(guards).toContain(BetterAuthGuard);

    const permissionOf = (name: keyof ExpenseReceiptsController) =>
      Reflect.getMetadata(
        PERMS_KEY,
        Object.getOwnPropertyDescriptor(
          ExpenseReceiptsController.prototype,
          name,
        )?.value as object,
      ) as string[];
    expect(permissionOf('upload')).toEqual(['CLASS_EXPENSE_WRITE']);
    expect(permissionOf('download')).toEqual(['CLASS_EXPENSE_READ']);
    expect(permissionOf('remove')).toEqual(['CLASS_EXPENSE_WRITE']);
  });

  it('stores an upload under the active org and the checked class', async () => {
    const result = await controller.upload(file, CLASS, user);

    expect(access.assertSchoolClassAccessible).toHaveBeenCalledWith(
      CLASS,
      ORG,
      user,
    );
    expect(receipts.put).toHaveBeenCalledWith(ORG, CLASS, file);
    expect(result).toEqual({
      fileId: FILE,
      url: `/api/expense-receipts/${FILE}`,
    });
  });

  it('never touches storage when the class is not accessible', async () => {
    access.assertSchoolClassAccessible.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(controller.upload(file, CLASS, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(controller.download(FILE, CLASS, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(controller.remove(FILE, CLASS, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(receipts.put).not.toHaveBeenCalled();
    expect(receipts.stream).not.toHaveBeenCalled();
    expect(receipts.delete).not.toHaveBeenCalled();
  });

  it('requires an active organization and a class id', async () => {
    await expect(
      controller.download(FILE, CLASS, { sub: 'user-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.download(FILE, '', user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      controller.upload(undefined as never, CLASS, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reads with the org of the session, not one supplied by the client', async () => {
    await controller.download(FILE, CLASS, user);
    expect(receipts.stream).toHaveBeenCalledWith(ORG, CLASS, FILE);
  });

  it('maps a missing object to NotFound', async () => {
    receipts.stream.mockRejectedValue(new Error('ENOENT'));
    await expect(controller.download(FILE, CLASS, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('only deletes receipts that are not attached to an expense', async () => {
    expensesRepo.exists.mockResolvedValue(true);
    await expect(controller.remove(FILE, CLASS, user)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(receipts.delete).not.toHaveBeenCalled();

    expensesRepo.exists.mockResolvedValue(false);
    await expect(controller.remove(FILE, CLASS, user)).resolves.toEqual({
      success: true,
    });
    expect(expensesRepo.exists).toHaveBeenLastCalledWith({
      where: { organizationId: ORG, receiptFileId: FILE },
    });
    expect(receipts.delete).toHaveBeenCalledWith(ORG, CLASS, FILE);
  });
});
