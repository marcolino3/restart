import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { Body } from '@nestjs/common';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { StorageService } from '@/storage/storage.service';
import { ContractGenerationService } from './contract-generation.service';
import { GenerateContractDocumentDto } from './dto/generate-contract-document.dto';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

// Employee ids are UUIDs. Handing anything else to TypeORM makes Postgres
// reject the parameter cast ("invalid input syntax for type uuid"), which
// surfaces to the client as an opaque 500 instead of a usable error.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  private readonly logger = new Logger(ContractDocumentsController.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly storage: StorageService,
    private readonly generation: ContractGenerationService,
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
    if (!UUID_RE.test(employeeId)) {
      throw new BadRequestException('employeeId must be a UUID');
    }

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
    try {
      await this.storage.put(
        this.key(orgId, fileId),
        file.buffer,
        'application/pdf',
      );
    } catch (error) {
      // Storage is an external dependency (S3 bucket, or the local filesystem
      // fallback which is read-only inside the hardened container). Its
      // failures are not the caller's fault, so report them as such instead of
      // letting them bubble up as a bare 500 "Internal server error".
      this.logger.error(
        `Contract document upload failed for employee ${employeeId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        'Document storage is unavailable. The contract was not uploaded.',
      );
    }

    return { url: `/api/contract-documents/${fileId}`, fileId };
  }

  /**
   * Renders a generated contract document from (already reviewed) HTML.
   * `pdf` is stored in object storage and linked on the contract
   * (`documentUrl`, replacing any previous document); `docx` is streamed back
   * as a download only and never stored.
   */
  @Post('generate')
  async generate(
    @Body() dto: GenerateContractDocumentDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<StreamableFile | { url: string; fileId: string }> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');

    // The contract must belong to the caller's active organization.
    const contract = await this.entityManager.findOne(EmployeeContract, {
      where: { id: dto.contractId, organizationId: orgId },
      relations: {
        employee: { membership: { user: true } },
      },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    let logoDataUrl: string | null = null;
    if (dto.showLogo ?? true) {
      const org = await this.entityManager.findOne(Organization, {
        where: { id: orgId },
      });
      logoDataUrl = await this.generation.loadLogoDataUrl(org?.logoUrl);
    }

    const input = {
      bodyHtml: dto.html,
      headerHtml: dto.headerHtml ?? null,
      footerHtml: dto.footerHtml ?? null,
      logoDataUrl,
    };

    if (dto.format === 'docx') {
      const buffer = await this.generation.generateDocx(input);
      const user_ = contract.employee?.membership?.user;
      const base =
        [user_?.firstName, user_?.lastName].filter(Boolean).join('_') ||
        'vertrag';
      const safeName = base.replace(/[^\p{L}\p{N}_-]+/gu, '_');
      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        disposition: `attachment; filename="vertrag_${safeName}.docx"`,
      });
    }

    const buffer = await this.generation.generatePdf(input);
    const fileId = randomUUID();
    try {
      await this.storage.put(
        this.key(orgId, fileId),
        buffer,
        'application/pdf',
      );
    } catch (error) {
      this.logger.error(
        `Generated contract document could not be stored for contract ${dto.contractId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        'Document storage is unavailable. The contract was not stored.',
      );
    }

    // Replace the previous document (best effort — the new link wins even if
    // the old object cannot be removed).
    const previous = contract.documentUrl?.match(
      /\/api\/contract-documents\/([a-zA-Z0-9-]+)$/,
    )?.[1];

    const url = `/api/contract-documents/${fileId}`;
    await this.entityManager.update(
      EmployeeContract,
      { id: contract.id, organizationId: orgId },
      { documentUrl: url },
    );

    if (previous) {
      try {
        await this.storage.delete(this.key(orgId, previous));
      } catch (error) {
        this.logger.warn(
          `Previous contract document ${previous} could not be deleted: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return { url, fileId };
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
    } catch (error) {
      // A missing object and an unreachable bucket are indistinguishable to
      // the caller (both mean "no document here"), but only the second is
      // worth an operator's attention — so log it before answering 404.
      this.logger.warn(
        `Contract document ${fileId} could not be read: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
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

    try {
      await this.storage.delete(this.key(orgId, fileId));
    } catch (error) {
      this.logger.error(
        `Contract document ${fileId} could not be deleted`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        'Document storage is unavailable. The contract was not removed.',
      );
    }
    return { success: true };
  }
}
