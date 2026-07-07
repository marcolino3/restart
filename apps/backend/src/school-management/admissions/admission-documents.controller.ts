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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { StorageService } from '@/storage/storage.service';
import { AdmissionDocumentsService } from './admission-documents.service';
import { AdmissionApplication } from './entities/admission-application.entity';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/** Allowed MIME types → file extension for the object key. */
const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Admission documents are file attachments for an application (PDF/image).
 * Stored in object storage under an org-scoped key
 * (`applications/<orgId>/<uuid>.<ext>`) and only ever reachable via this
 * authenticated controller, keyed on the CALLER's active organization — so a
 * download can only reach that org's files (multi-tenant isolation by
 * construction). Metadata lives in `admission_documents` (see the resolver for
 * listing). Access is gated by the same admin roles as contract documents.
 */
@Controller('admission-documents')
@UseGuards(BetterAuthGuard)
@Roles(SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN)
export class AdmissionDocumentsController {
  constructor(
    @InjectRepository(AdmissionApplication)
    private readonly applicationsRepo: Repository<AdmissionApplication>,
    private readonly documents: AdmissionDocumentsService,
    private readonly storage: StorageService,
  ) {}

  /** Org-scoped object key, refusing invalid org/file references. */
  private key(orgId: string, fileId: string, ext: string): string {
    const safeOrg = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeFile = fileId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeExt = ext.replace(/[^a-z0-9]/g, '');
    if (!safeOrg || !safeFile || !safeExt) {
      throw new BadRequestException('Invalid document reference');
    }
    return `applications/${safeOrg}/${safeFile}.${safeExt}`;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('applicationId') applicationId: string,
    @CurrentUser() user: TokenPayload,
    @Query('title') title?: string,
    @Query('tags') tags?: string,
  ): Promise<{ id: string; fileId: string }> {
    if (!file) throw new BadRequestException('No file provided');
    const ext = ALLOWED[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Only PDF, JPEG, PNG or WebP files are allowed',
      );
    }
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');
    if (!applicationId) {
      throw new BadRequestException('applicationId required');
    }

    // The target application must belong to the caller's active organization.
    const application = await this.applicationsRepo.findOne({
      where: { id: applicationId, organizationId: orgId },
      select: ['id'],
    });
    if (!application) {
      throw new ForbiddenException('Application outside active organization');
    }

    const fileId = randomUUID();
    await this.storage.put(
      this.key(orgId, fileId, ext),
      file.buffer,
      file.mimetype,
    );

    // Tags arrive comma-separated; trim, drop empties and cap the count/length.
    const parsedTags = (tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)
      .map((t) => t.slice(0, 50));

    const doc = await this.documents.create({
      organizationId: orgId,
      applicationId,
      fileId,
      originalName: file.originalname,
      title: title?.trim() ? title.trim().slice(0, 200) : null,
      tags: parsedTags,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedByMembershipId: user.membershipId ?? null,
    });

    return { id: doc.id, fileId: doc.fileId };
  }

  @Get(':id')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StreamableFile> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    const doc = await this.documents.findOneOwned(id, orgId);
    const ext = ALLOWED[doc.mimeType] ?? 'bin';

    try {
      const { stream } = await this.storage.getStream(
        this.key(orgId, doc.fileId, ext),
      );
      return new StreamableFile(stream, {
        type: doc.mimeType,
        disposition: `inline; filename="${doc.originalName.replace(/"/g, '')}"`,
      });
    } catch {
      throw new NotFoundException('Document not found');
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ success: boolean }> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    const doc = await this.documents.findOneOwned(id, orgId);
    const ext = ALLOWED[doc.mimeType] ?? 'bin';
    await this.storage.delete(this.key(orgId, doc.fileId, ext));
    await this.documents.remove(id, orgId);
    return { success: true };
  }
}
