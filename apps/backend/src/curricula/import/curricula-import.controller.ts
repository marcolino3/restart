import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { CurriculaImportService } from './curricula-import.service';
import { ImportPlanType } from './dto/import-plan.types';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

@Controller('curricula/import')
export class CurriculaImportController {
  constructor(private readonly importService: CurriculaImportService) {}

  @Post('preview')
  @UseGuards(BetterAuthGuard)
  @Permissions('CURRICULUM_MANAGE')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  preview(@UploadedFile() file: Express.Multer.File): ImportPlanType {
    if (!file) throw new BadRequestException('No file provided');

    const name = (file.originalname ?? '').toLowerCase();
    const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Unsupported file type "${ext || file.mimetype}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    try {
      return this.importService.previewFromBuffer(file.buffer, name);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Failed to parse curriculum file',
      );
    }
  }
}
