import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { ClassBudgetAccessService } from './class-budget-access.service';
import { ClassExpense } from './entities/class-expense.entity';
import {
  ExpenseReceiptsService,
  RECEIPT_MAX_BYTES,
} from './expense-receipts.service';

/**
 * Receipts (Rechnungen/Quittungen) of class expenses. Private storage, served
 * only through this authenticated, org-scoped controller.
 *
 * `schoolClassId` is required on every operation and checked against the
 * caller's visible classes before storage is touched — see
 * ExpenseReceiptsService for why the class is part of the storage key.
 */
@Controller('expense-receipts')
@UseGuards(BetterAuthGuard)
export class ExpenseReceiptsController {
  constructor(
    @InjectRepository(ClassExpense)
    private readonly expensesRepo: Repository<ClassExpense>,
    private readonly receipts: ExpenseReceiptsService,
    private readonly access: ClassBudgetAccessService,
  ) {}

  private async authorize(
    user: TokenPayload,
    schoolClassId: string,
  ): Promise<string> {
    if (!user.orgId) throw new ForbiddenException('No active organization');
    if (!schoolClassId) {
      throw new BadRequestException('schoolClassId required');
    }
    await this.access.assertSchoolClassAccessible(
      schoolClassId,
      user.orgId,
      user,
    );
    return user.orgId;
  }

  @Post()
  @Permissions('CLASS_EXPENSE_WRITE')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: RECEIPT_MAX_BYTES } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('schoolClassId') schoolClassId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ url: string; fileId: string }> {
    if (!file) throw new BadRequestException('No file provided');
    const orgId = await this.authorize(user, schoolClassId);

    const fileId = await this.receipts.put(orgId, schoolClassId, file);
    return { url: `/api/expense-receipts/${fileId}`, fileId };
  }

  @Get(':fileId')
  @Permissions('CLASS_EXPENSE_READ')
  async download(
    @Param('fileId') fileId: string,
    @Query('schoolClassId') schoolClassId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StreamableFile> {
    const orgId = await this.authorize(user, schoolClassId);

    try {
      const stream = await this.receipts.stream(orgId, schoolClassId, fileId);
      return new StreamableFile(stream, {
        type: this.receipts.mimeOf(fileId),
        disposition: 'inline; filename="receipt"',
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new NotFoundException('Receipt not found');
    }
  }

  /**
   * Removes an upload that never made it onto an expense (form cancelled,
   * file replaced before saving). A receipt that is attached to an expense is
   * only removed through the expense itself, where authorship is enforced.
   */
  @Delete(':fileId')
  @Permissions('CLASS_EXPENSE_WRITE')
  async remove(
    @Param('fileId') fileId: string,
    @Query('schoolClassId') schoolClassId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ success: boolean }> {
    const orgId = await this.authorize(user, schoolClassId);

    const attached = await this.expensesRepo.exists({
      where: { organizationId: orgId, receiptFileId: fileId },
    });
    if (attached) {
      throw new ConflictException(
        'Receipt is attached to an expense — change the expense instead',
      );
    }
    await this.receipts.delete(orgId, schoolClassId, fileId);
    return { success: true };
  }
}
