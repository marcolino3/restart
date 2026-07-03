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
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';

/**
 * Contract documents (PDF) live OUTSIDE public/ — they are sensitive HR files
 * and must not be served unauthenticated (unlike avatars). Storage is scoped
 * per organization (`<root>/<orgId>/<uuid>.pdf`) so a download keyed on the
 * caller's active org can only ever reach that org's files (multi-tenant
 * isolation by construction). Access is additionally gated by the same admin
 * roles as the avatar upload.
 */
const DOC_ROOT = path.join(
  process.cwd(),
  'private-uploads',
  'employee-contracts',
);
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

@Controller('contract-documents')
@UseGuards(BetterAuthGuard)
@Roles(SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN)
export class ContractDocumentsController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /** Absolute `<root>/<org>/<file>.pdf`, refusing any path traversal. */
  private resolvePath(orgId: string, fileId: string): string {
    const safeOrg = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeFile = fileId.replace(/[^a-zA-Z0-9-]/g, '');
    if (!safeOrg || !safeFile) {
      throw new BadRequestException('Invalid document reference');
    }
    const orgDir = path.resolve(DOC_ROOT, safeOrg);
    const resolved = path.resolve(orgDir, `${safeFile}.pdf`);
    if (!resolved.startsWith(orgDir + path.sep)) {
      throw new ForbiddenException('Resolved path escapes the document root');
    }
    return resolved;
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }),
  )
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
    const filePath = this.resolvePath(orgId, fileId);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    return { url: `/api/contract-documents/${fileId}`, fileId };
  }

  @Get(':fileId')
  async download(
    @Param('fileId') fileId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StreamableFile> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    const filePath = this.resolvePath(orgId, fileId);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('Document not found');
    }
    return new StreamableFile(createReadStream(filePath), {
      type: 'application/pdf',
      disposition: 'inline; filename="vertrag.pdf"',
    });
  }

  @Delete(':fileId')
  async remove(
    @Param('fileId') fileId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ success: boolean }> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    const filePath = this.resolvePath(orgId, fileId);
    try {
      await fs.unlink(filePath);
    } catch {
      // Already gone — treat as success (idempotent).
    }
    return { success: true };
  }
}
