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
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StorageService } from '@/storage/storage.service';
import { StudentRecordDocumentsService } from './student-record-documents.service';
import { StudentRecordEntry } from './entities/student-record-entry.entity';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/** Allowed MIME types → file extension for the object key. */
const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Student record documents are file attachments for a support-record entry
 * (PDF/image). Stored in object storage under an org-scoped key
 * (`student-records/<orgId>/<uuid>.<ext>`) and only ever reachable via this
 * authenticated controller, keyed on the CALLER's active organization — so a
 * download can only reach that org's files (multi-tenant isolation by
 * construction). Gated by the same STUDENT_RECORD_* permissions as the rest of
 * the feature (upload=WRITE, download=READ, delete=DELETE). Modeled on
 * AdmissionDocumentsController.
 */
@Controller('student-record-documents')
@UseGuards(BetterAuthGuard)
export class StudentRecordDocumentsController {
  constructor(
    @InjectRepository(StudentRecordEntry)
    private readonly entriesRepo: Repository<StudentRecordEntry>,
    private readonly documents: StudentRecordDocumentsService,
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
    return `student-records/${safeOrg}/${safeFile}.${safeExt}`;
  }

  @Post()
  @Permissions('STUDENT_RECORD_WRITE')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entryId') entryId: string,
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
    if (!entryId) {
      throw new BadRequestException('entryId required');
    }

    // The target entry must belong to the caller's active organization.
    const entry = await this.entriesRepo.findOne({
      where: { id: entryId, organizationId: orgId },
      select: ['id'],
    });
    if (!entry) {
      throw new ForbiddenException('Entry outside active organization');
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
      entryId,
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
  @Permissions('STUDENT_RECORD_READ')
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
  @Permissions('STUDENT_RECORD_DELETE')
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
