import {
  BadRequestException,
  Controller,
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
import { StudentImportPlanType } from './dto/student-import-plan.types';
import { StudentsImportService } from './students-import.service';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

@Controller('students/import')
export class StudentsImportController {
  constructor(private readonly importService: StudentsImportService) {}

  @Post('preview')
  @UseGuards(BetterAuthGuard)
  @Permissions('STUDENT_WRITE', 'CONTACT_PERSON_WRITE')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: TokenPayload,
  ): Promise<StudentImportPlanType> {
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
      return await this.importService.previewFromBuffer(
        file.buffer,
        name,
        orgId,
      );
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Failed to parse student file',
      );
    }
  }
}
