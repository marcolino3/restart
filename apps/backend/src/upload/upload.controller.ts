import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Logger,
  Post,
  Query,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import sharp from 'sharp';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { Student } from '@/school-management/students/entities/student.entity';
import { StorageService } from '@/storage/storage.service';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

// Images only. Sensitive documents (e.g. employment contracts) must NOT be
// stored here — these are public assets (avatars, org logos) served
// unauthenticated via /api/uploads. Contracts use the authenticated,
// org-scoped ContractDocumentsController instead.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

// Every entity here must have an ownership rule in assertTargetInOrg().
// Objects are public (served unauthenticated), so writes must be limited to
// targets the caller actually owns.
const ALLOWED_ENTITIES = new Set(['organizations', 'employees', 'students']);

// Every upload target is keyed by a UUID. Anything else cannot match a row and
// would make Postgres reject the parameter cast, turning a client mistake into
// an opaque 500.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('upload')
@UseGuards(BetterAuthGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly storage: StorageService,
  ) {}

  /** Object storage key for a public asset. */
  private key(safeEntity: string, safeId: string): string {
    return `uploads/${safeEntity}/${safeId}.webp`;
  }

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
        `Unsupported file type "${file.mimetype}". Allowed: images only`,
      );
    }

    let webp: Buffer;
    try {
      webp = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
    } catch {
      throw new BadRequestException('File is not a valid image');
    }

    await this.withTargetLock(safeEntity, safeId, user, async () => {
      try {
        await this.storage.put(
          this.key(safeEntity, safeId),
          webp,
          'image/webp',
        );
      } catch (error) {
        // See ContractDocumentsController: a storage outage is not a client
        // error, and a bare 500 tells the user nothing about what to retry.
        this.logger.error(
          `Upload failed for ${safeEntity}/${safeId}`,
          error instanceof Error ? error.stack : String(error),
        );
        throw new ServiceUnavailableException(
          'File storage is unavailable. The file was not uploaded.',
        );
      }
    });

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
    await this.withTargetLock(safeEntity, safeId, user, async () => {
      try {
        await this.storage.delete(this.key(safeEntity, safeId));
      } catch (error) {
        this.logger.error(
          `Delete failed for ${safeEntity}/${safeId}`,
          error instanceof Error ? error.stack : String(error),
        );
        throw new ServiceUnavailableException(
          'File storage is unavailable. The file was not removed.',
        );
      }
    });

    return { success: true };
  }

  /** Finish storage writes before a concurrent draft deletion can queue cleanup. */
  private async withTargetLock(
    entity: string,
    id: string,
    user: TokenPayload,
    operation: () => Promise<void>,
  ) {
    if (entity !== 'employees') return operation();
    await this.entityManager.transaction(async (manager) => {
      await manager.findOneOrFail(Organization, {
        where: { id: user.orgId },
        lock: { mode: 'pessimistic_write' },
      });
      const employee = await manager.findOne(Employee, {
        where: { id, organizationId: user.orgId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!employee)
        throw new ForbiddenException(
          'Upload target outside active organization',
        );
      await operation();
    });
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

    if (!UUID_RE.test(safeId)) {
      throw new BadRequestException('id must be a UUID');
    }

    await this.assertTargetInOrg(safeEntity, safeId, user);

    return { safeEntity, safeId };
  }

  private async assertTargetInOrg(
    safeEntity: string,
    safeId: string,
    user: TokenPayload,
  ): Promise<void> {
    if (safeEntity === 'employees') {
      if (
        !user.orgId ||
        (!user.isSuperAdmin && !user.permissions?.includes('EMPLOYEE_WRITE'))
      ) {
        throw new ForbiddenException(
          'Employee write permission in an active organization is required',
        );
      }
      const employee = await this.entityManager.findOne(Employee, {
        where: { id: safeId, organizationId: user.orgId },
      });
      if (!employee)
        throw new ForbiddenException(
          'Upload target outside active organization',
        );
      return;
    }
    if (user.isSuperAdmin) return;
    if (
      !user.roles?.some(
        (role) =>
          role === String(SystemRole.ORG_OWNER) ||
          role === String(SystemRole.ORG_ADMIN),
      )
    ) {
      throw new ForbiddenException('Organization administrator role required');
    }
    if (safeEntity === 'organizations') {
      if (!user.orgId || safeId !== user.orgId)
        throw new ForbiddenException(
          'Upload target outside active organization',
        );
      return;
    }

    // students: the target student must belong to the caller's active org.
    // Unlike employees the org link is a direct column, so no relation join.
    if (safeEntity === 'students') {
      if (!user.orgId) {
        throw new ForbiddenException('No active organization');
      }
      const student = await this.entityManager.findOne(Student, {
        where: { id: safeId, organizationId: user.orgId },
      });
      if (!student) {
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
