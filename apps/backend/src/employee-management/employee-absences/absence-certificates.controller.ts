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
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { StorageService } from '@/storage/storage.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Arztzeugnisse / Nachweise: private Storage under
 * `absence-certificates/<orgId>/<uuid>.<ext>`, served only via this
 * authenticated, org-scoped controller.
 *
 * Access mirrors GraphQL absences: TIMESHEET_* + TimeTrackingAccessService
 * (Admin/HR, self, Team Lead for team members). `employeeId` is required on
 * every operation so medical files are never addressable by fileId alone.
 */
@Controller('absence-certificates')
@UseGuards(BetterAuthGuard)
export class AbsenceCertificatesController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly storage: StorageService,
    private readonly access: TimeTrackingAccessService,
  ) {}

  private key(orgId: string, fileId: string): string {
    const safeOrg = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeFile = fileId.replace(/[^a-zA-Z0-9.-]/g, '');
    if (!safeOrg || !safeFile || !safeFile.includes('.')) {
      throw new BadRequestException('Invalid document reference');
    }
    return `absence-certificates/${safeOrg}/${safeFile}`;
  }

  private mimeFromFileId(fileId: string): string {
    const ext = fileId.split('.').pop()?.toLowerCase();
    const entry = Object.entries(ALLOWED_MIME).find(([, e]) => e === ext);
    return entry?.[0] ?? 'application/octet-stream';
  }

  private requireOrgId(user: TokenPayload): string {
    if (!user.orgId) throw new ForbiddenException('No active organization');
    return user.orgId;
  }

  private async assertEmployeeInOrg(
    employeeId: string,
    orgId: string,
    user: TokenPayload,
  ): Promise<void> {
    if (user.isSuperAdmin) return;
    const employee = await this.entityManager.findOne(Employee, {
      where: { id: employeeId, membership: { organizationId: orgId } },
      relations: { membership: true },
    });
    if (!employee) {
      throw new ForbiddenException('Employee outside active organization');
    }
  }

  @Post()
  @Permissions('TIMESHEET_WRITE')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('employeeId') employeeId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ url: string; fileId: string }> {
    if (!file) throw new BadRequestException('No file provided');
    const ext = ALLOWED_MIME[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Only PDF, JPEG, PNG or WebP documents are allowed',
      );
    }
    const orgId = this.requireOrgId(user);
    if (!employeeId) throw new BadRequestException('employeeId required');

    await this.assertEmployeeInOrg(employeeId, orgId, user);
    await this.access.assertCanManageAbsence(user, employeeId);

    const fileId = `${randomUUID()}.${ext}`;
    await this.storage.put(this.key(orgId, fileId), file.buffer, file.mimetype);

    return { url: `/api/absence-certificates/${fileId}`, fileId };
  }

  @Get(':fileId')
  @Permissions('TIMESHEET_READ')
  async download(
    @Param('fileId') fileId: string,
    @Query('employeeId') employeeId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StreamableFile> {
    const orgId = this.requireOrgId(user);
    if (!employeeId) throw new BadRequestException('employeeId required');

    await this.assertEmployeeInOrg(employeeId, orgId, user);
    await this.access.assertCanViewEmployee(user, employeeId);

    try {
      const { stream } = await this.storage.getStream(this.key(orgId, fileId));
      return new StreamableFile(stream, {
        type: this.mimeFromFileId(fileId),
        disposition: 'inline; filename="arztzeugnis"',
      });
    } catch {
      throw new NotFoundException('Document not found');
    }
  }

  @Delete(':fileId')
  @Permissions('TIMESHEET_WRITE')
  async remove(
    @Param('fileId') fileId: string,
    @Query('employeeId') employeeId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ success: boolean }> {
    const orgId = this.requireOrgId(user);
    if (!employeeId) throw new BadRequestException('employeeId required');

    await this.assertEmployeeInOrg(employeeId, orgId, user);
    await this.access.assertCanManageAbsence(user, employeeId);

    await this.storage.delete(this.key(orgId, fileId));
    return { success: true };
  }
}
