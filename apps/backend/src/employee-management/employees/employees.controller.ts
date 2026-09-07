import {
  BadRequestException,
  Controller,
  HttpException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import {
  EmployeeImportResult,
  EmployeeImportService,
} from './employee-import.service';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

@Controller('employees')
@UseGuards(BetterAuthGuard)
export class EmployeesController {
  constructor(private readonly importService: EmployeeImportService) {}

  /**
   * Imports employees from a CSV/Excel file (one employee per row). Columns
   * are matched against the catalog in employee-import-columns.ts; protected
   * columns (salary, bank details, medical data) additionally require the
   * matching field-level permission.
   */
  @Post('upload')
  @Permissions('EMPLOYEE_WRITE')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeImportResult> {
    if (!file) throw new BadRequestException('No file provided');

    const orgId = user.orgId;
    if (!orgId) throw new BadRequestException('No organization selected');

    const name = (file.originalname ?? '').toLowerCase();
    const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Unsupported file type "${ext || file.mimetype}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    try {
      return await this.importService.importFile(
        file.buffer,
        name,
        orgId,
        user,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Failed to parse employee file',
      );
    }
  }
}
