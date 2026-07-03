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
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';

const UPLOAD_ROOT = path.join(process.cwd(), 'public');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  // Vertragsdokumente (employees-Entity): PDF-Upload.
  'application/pdf',
]);

// Every entity here must have an ownership rule in assertTargetInOrg().
// Uploaded files land in the public/ directory and are served unauthenticated,
// so writes must be limited to targets the caller actually owns.
const ALLOWED_ENTITIES = new Set(['organizations', 'employees']);

@Controller('upload')
@UseGuards(BetterAuthGuard)
@Roles(SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN)
export class UploadController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

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

    const { safeEntity, safeId } = await this.resolveTarget(entity, id, user);

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed: images or PDF`,
      );
    }

    const filePath = this.safeFilePath(safeEntity, `${safeId}.webp`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

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

    const { safeEntity, safeId } = await this.resolveTarget(entity, id, user);

    const filePath = this.safeFilePath(safeEntity, `${safeId}.webp`);

    try {
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist — that's fine
    }

    return { success: true };
  }

  /**
   * Builds an absolute path under UPLOAD_ROOT and refuses anything that
   * resolves outside it. `safeEntity`/`fileName` are already stripped to
   * `[A-Za-z0-9_-]` by resolveTarget, so no traversal is reachable at
   * runtime — this containment check is the explicit barrier (also clears
   * the static path-injection analysis and guards future entity additions).
   */
  private safeFilePath(safeEntity: string, fileName: string): string {
    const resolved = path.resolve(UPLOAD_ROOT, safeEntity, fileName);
    if (!resolved.startsWith(UPLOAD_ROOT + path.sep)) {
      throw new ForbiddenException('Resolved upload path escapes the root');
    }
    return resolved;
  }

  private async resolveTarget(
    entity: string,
    id: string,
    user: TokenPayload,
  ): Promise<{ safeEntity: string; safeId: string }> {
    // Sanitize: strips path separators and dots (no traversal possible)
    const safeEntity = entity.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');

    if (!ALLOWED_ENTITIES.has(safeEntity)) {
      throw new BadRequestException(
        `Unsupported upload entity "${safeEntity}"`,
      );
    }

    await this.assertTargetInOrg(safeEntity, safeId, user);

    return { safeEntity, safeId };
  }

  private async assertTargetInOrg(
    safeEntity: string,
    safeId: string,
    user: TokenPayload,
  ): Promise<void> {
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

    // employees: the target employee must belong to the caller's active org
    // (verified via the employee's membership). Avatar uploads run during the
    // onboarding wizard, so the DRAFT employee already exists at this point.
    if (safeEntity === 'employees') {
      if (!user.orgId) {
        throw new ForbiddenException('No active organization');
      }
      const employee = await this.entityManager.findOne(Employee, {
        where: { id: safeId, membership: { organizationId: user.orgId } },
        relations: { membership: true },
      });
      if (!employee) {
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
