import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { StorageService } from '@/storage/storage.service';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Signed consent documents (evidence, PDF) are sensitive personal data: never
 * public. Stored in object storage under an org-scoped key
 * (`consent-evidence/<orgId>/<uuid>.pdf`) and only reachable via this
 * authenticated controller, keyed on the CALLER's active organization — so a
 * download can only ever reach that org's files (multi-tenant isolation by
 * construction). Gated by the roles that manage consent.
 */
@Controller('consent-documents')
@UseGuards(BetterAuthGuard)
@Roles(
  SystemRole.ORG_OWNER,
  SystemRole.ORG_ADMIN,
  SystemRole.HR_MANAGER,
  SystemRole.OFFICE,
)
export class ConsentDocumentsController {
  constructor(private readonly storage: StorageService) {}

  /** Org-scoped object key, refusing invalid org/file references. */
  private key(orgId: string, fileId: string): string {
    const safeOrg = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeFile = fileId.replace(/[^a-zA-Z0-9-]/g, '');
    if (!safeOrg || !safeFile) {
      throw new BadRequestException('Invalid document reference');
    }
    return `consent-evidence/${safeOrg}/${safeFile}.pdf`;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ url: string; fileId: string }> {
    if (!file) throw new BadRequestException('No file provided');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF documents are allowed');
    }
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    const fileId = randomUUID();
    await this.storage.put(
      this.key(orgId, fileId),
      file.buffer,
      'application/pdf',
    );

    return { url: `/api/consent-documents/${fileId}`, fileId };
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
        disposition: 'inline; filename="einwilligung.pdf"',
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
