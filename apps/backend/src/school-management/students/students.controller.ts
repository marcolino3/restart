import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StudentsService } from './students.service';
import { Gender } from '@/database/enums/gender.enum';

interface CsvRow {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  enrollmentDate?: string;
  notes?: string;
}

interface UploadResult {
  created: { name: string }[];
  failed: { name: string; reason: string }[];
}

const VALID_GENDERS = new Set(Object.values(Gender));

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(';').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });
    return row as CsvRow;
  });
}

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: TokenPayload,
  ): Promise<UploadResult> {
    if (!file) throw new BadRequestException('No file provided');

    const orgId = user.orgId;
    if (!orgId) throw new BadRequestException('No organization selected');

    const text = file.buffer.toString('utf-8');
    const rows = parseCsv(text);

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    const created: { name: string }[] = [];
    const failed: { name: string; reason: string }[] = [];

    for (const row of rows) {
      const firstName = row.firstName?.trim();
      const lastName = row.lastName?.trim();

      if (!firstName || !lastName) {
        failed.push({
          name: `${firstName || ''} ${lastName || ''}`.trim() || '(empty)',
          reason: 'firstName and lastName are required',
        });
        continue;
      }

      const genderRaw = row.gender?.trim().toUpperCase();
      const gender = VALID_GENDERS.has(genderRaw as Gender)
        ? (genderRaw as Gender)
        : undefined;

      try {
        await this.studentsService.create(
          {
            firstName,
            lastName,
            dateOfBirth: row.dateOfBirth?.trim() || undefined,
            gender,
            enrollmentDate: row.enrollmentDate?.trim() || undefined,
            notes: row.notes?.trim() || undefined,
          },
          orgId,
        );
        created.push({ name: `${firstName} ${lastName}` });
      } catch (error) {
        failed.push({
          name: `${firstName} ${lastName}`,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { created, failed };
  }
}
