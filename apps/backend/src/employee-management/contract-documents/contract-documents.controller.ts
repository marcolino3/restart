import {
  BadRequestException,
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
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { StorageService } from '@/storage/storage.service';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Contract documents (PDF) are sensitive HR files: never public. Stored in
 * object storage under an org-scoped key (`contracts/<orgId>/<uuid>.pdf`) and
 * only ever reachable via this authenticated controller, keyed on the CALLER's
 * active organization — so a download can only reach that org's files
 * (multi-tenant isolation by construction). Access is gated by the same admin
 * roles as the avatar upload.
 */
@Controller('contract-documents')
@UseGuards(BetterAuthGuard)
@Roles(SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN)
export class ContractDocumentsController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly storage: StorageService,
  ) {}

  /** Org-scoped object key, refusing invalid org/file references. */
  private key(orgId: string, fileId: string): string {
    const safeOrg = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeFile = fileId.replace(/[^a-zA-Z0-9-]/g, '');
    if (!safeOrg || !safeFile) {
      throw new BadRequestException('Invalid document reference');
    }
    return `contracts/${safeOrg}/${safeFile}.pdf`;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('employeeId') employeeId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ url: string; fileId: string }> {
    if (!file) throw new BadRequestException('No file provided');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF documents are allowed');
    }
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');
    if (!employeeId) throw new BadRequestException('employeeId required');

    // The target employee must belong to the caller's active organization.
    if (!user.isSuperAdmin) {
      const employee = await this.entityManager.findOne(Employee, {
        where: { id: employeeId, membership: { organizationId: orgId } },
        relations: { membership: true },
      });
      if (!employee) {
        throw new ForbiddenException('Employee outside active organization');
      }
    }

    const fileId = randomUUID();
    await this.storage.put(
      this.key(orgId, fileId),
      file.buffer,
      'application/pdf',
    );

    return { url: `/api/contract-documents/${fileId}`, fileId };
  }

  @Get(':fileId')
  async download(
    @Param('fileId') fileId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StreamableFile> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    try {
      const { stream } = await this.storage.getStream(this.key(orgId, fileId));
      return new StreamableFile(stream, {
        type: 'application/pdf',
        disposition: 'inline; filename="vertrag.pdf"',
      });
    } catch {
      throw new NotFoundException('Document not found');
    }
  }

  @Delete(':fileId')
  async remove(
    @Param('fileId') fileId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ success: boolean }> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    await this.storage.delete(this.key(orgId, fileId));
    return { success: true };
  }
}
