import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';

const UPLOAD_ROOT = path.join(process.cwd(), 'public');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

// Every entity here must have an ownership rule in assertTargetInOrg().
// Uploaded files land in the public/ directory and are served unauthenticated,
// so writes must be limited to targets the caller actually owns.
const ALLOWED_ENTITIES = new Set(['organizations']);

@Controller('upload')
@UseGuards(BetterAuthGuard)
@Roles(SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN)
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entity') entity: string,
    @Query('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!entity || !id) throw new BadRequestException('entity and id required');

    const { safeEntity, safeId } = this.resolveTarget(entity, id, user);

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed: images only`,
      );
    }

    const dir = path.join(UPLOAD_ROOT, safeEntity);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${safeId}.webp`);

    try {
      await sharp(file.buffer).webp({ quality: 80 }).toFile(filePath);
    } catch {
      throw new BadRequestException('File is not a valid image');
    }

    return {
      url: `/${safeEntity}/${safeId}.webp`,
    };
  }

  @Delete()
  async remove(
    @Query('entity') entity: string,
    @Query('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    if (!entity || !id) throw new BadRequestException('entity and id required');

    const { safeEntity, safeId } = this.resolveTarget(entity, id, user);

    const filePath = path.join(UPLOAD_ROOT, safeEntity, `${safeId}.webp`);

    try {
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist — that's fine
    }

    return { success: true };
  }

  private resolveTarget(
    entity: string,
    id: string,
    user: TokenPayload,
  ): { safeEntity: string; safeId: string } {
    // Sanitize: strips path separators and dots (no traversal possible)
    const safeEntity = entity.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');

    if (!ALLOWED_ENTITIES.has(safeEntity)) {
      throw new BadRequestException(
        `Unsupported upload entity "${safeEntity}"`,
      );
    }

    this.assertTargetInOrg(safeEntity, safeId, user);

    return { safeEntity, safeId };
  }

  private assertTargetInOrg(
    safeEntity: string,
    safeId: string,
    user: TokenPayload,
  ): void {
    if (user.isSuperAdmin) return;

    // organizations: the target must be the caller's active organization
    if (safeEntity === 'organizations') {
      if (!user.orgId || safeId !== user.orgId) {
        throw new ForbiddenException(
          'Upload target outside active organization',
        );
      }
      return;
    }

    // Fail closed for entities without an explicit rule
    throw new ForbiddenException('No ownership rule for this upload entity');
  }
}
