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
import { randomUUID } from 'crypto';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StorageService } from '@/storage/storage.service';
import { LessonRecordAttachmentsService } from './lesson-record-attachments.service';

/**
 * Upload ceiling. The existing image-only UploadController caps at 5 MB
 * (MAX_UPLOAD_BYTES), which is right for avatars but too tight here: this
 * route also takes PDFs — a scanned multi-page worksheet routinely exceeds
 * 5 MB. 15 MB matches what the other document routes in this codebase already
 * allow (chat attachments, student-record documents), so the whole product
 * has ONE document ceiling rather than three different ones.
 */
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/** Allowed MIME types → file extension for the object key. */
const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/**
 * Attachments on a lesson record — a photo of the child's work or a scanned
 * PDF. Binaries live in object storage under an org-scoped key
 * (`lesson-records/<orgId>/<uuid>.<ext>`) and are served ONLY by this
 * authenticated controller, keyed on the CALLER's active organization: the
 * key is rebuilt from `user.orgId`, never from the request, so a download can
 * only ever reach the caller's own tenant (multi-tenant isolation by
 * construction — mirrors StudentRecordDocumentsController).
 *
 * Deliberately NOT served as a public/static asset: these files show
 * identifiable children's work and must not be reachable by URL guessing.
 *
 * Gated by the record-keeping permissions (upload/delete = WRITE,
 * download = READ). There is no RECORD_KEEPING_DELETE code in the catalog, so
 * delete rides on WRITE like the other mutating record-keeping operations.
 */
@Controller('lesson-record-attachments')
@UseGuards(BetterAuthGuard)
export class LessonRecordAttachmentsController {
  constructor(
    private readonly attachments: LessonRecordAttachmentsService,
    private readonly storage: StorageService,
  ) {}

  /** Org-scoped object key, refusing invalid org/file references. */
  private key(orgId: string, fileId: string, ext: string): string {
    const safeOrg = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeFile = fileId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeExt = ext.replace(/[^a-z0-9]/g, '');
    if (!safeOrg || !safeFile || !safeExt) {
      throw new BadRequestException('Invalid attachment reference');
    }
    return `lesson-records/${safeOrg}/${safeFile}.${safeExt}`;
  }

  @Post()
  @Permissions('RECORD_KEEPING_WRITE')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('lessonRecordId') lessonRecordId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ id: string; fileName: string }> {
    if (!file) throw new BadRequestException('No file provided');
    const ext = ALLOWED[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Only PDF, JPEG, PNG, WebP, GIF or AVIF files are allowed',
      );
    }
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');
    if (!lessonRecordId) {
      throw new BadRequestException('lessonRecordId required');
    }

    // The target record must belong to the caller's active organization.
    await this.attachments.assertRecordInOrg(lessonRecordId, orgId);

    const storageKey = this.key(orgId, randomUUID(), ext);
    await this.storage.put(storageKey, file.buffer, file.mimetype);

    const attachment = await this.attachments.create({
      lessonRecordId,
      organizationId: orgId,
      storageKey,
      fileName: file.originalname.slice(0, 255),
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedById: user.sub ?? null,
    });

    return { id: attachment.id, fileName: attachment.fileName };
  }

  /**
   * Attachment metadata for one record. Declared before `:id` so the literal
   * segment is not swallowed by the param route.
   */
  @Get()
  @Permissions('RECORD_KEEPING_READ')
  async list(
    @Query('lessonRecordId') lessonRecordId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<
    Array<{
      id: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: Date;
    }>
  > {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');
    if (!lessonRecordId) {
      throw new BadRequestException('lessonRecordId required');
    }

    await this.attachments.assertRecordInOrg(lessonRecordId, orgId);

    const rows = await this.attachments.findByRecord(lessonRecordId, orgId);
    // storageKey stays server-side: the client addresses a file by id only.
    return rows.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      createdAt: r.createdAt,
    }));
  }

  @Get(':id')
  @Permissions('RECORD_KEEPING_READ')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StreamableFile> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    const attachment = await this.attachments.findOneOwned(id, orgId);

    try {
      const { stream } = await this.storage.getStream(attachment.storageKey);
      return new StreamableFile(stream, {
        type: attachment.mimeType,
        disposition: `inline; filename="${attachment.fileName.replace(/"/g, '')}"`,
      });
    } catch {
      throw new NotFoundException('Attachment not found');
    }
  }

  @Delete(':id')
  @Permissions('RECORD_KEEPING_WRITE')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ success: boolean }> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    const attachment = await this.attachments.findOneOwned(id, orgId);
    await this.storage.delete(attachment.storageKey);
    await this.attachments.remove(id, orgId);
    return { success: true };
  }
}
