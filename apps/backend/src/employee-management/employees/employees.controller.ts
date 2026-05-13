import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeesService } from './employees.service';
import { Persona } from '@/common/enums/persona.enum';

interface CsvRow {
  email?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  persona?: string;
  contactPhone?: string;
  dateOfBirth?: string;
}

interface UploadResult {
  created: { email: string }[];
  failed: { email: string; reason: string }[];
}

const VALID_PERSONAS = new Set(Object.values(Persona));

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

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

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

    const created: { email: string }[] = [];
    const failed: { email: string; reason: string }[] = [];

    for (const row of rows) {
      const email = row.email?.trim();
      if (!email) {
        failed.push({ email: '(empty)', reason: 'Email is required' });
        continue;
      }

      const personaRaw = row.persona?.trim().toUpperCase();
      const persona = VALID_PERSONAS.has(personaRaw as Persona)
        ? (personaRaw as Persona)
        : Persona.EMPLOYEE;

      try {
        await this.employeesService.createEmployeeMinimal(
          {
            email,
            firstName: row.firstName?.trim() || '',
            lastName: row.lastName?.trim() || '',
            persona,
            title: row.title?.trim() || undefined,
            contactPhone: row.contactPhone?.trim() || undefined,
            dateOfBirth: row.dateOfBirth?.trim() || undefined,
          },
          orgId,
        );
        created.push({ email });
      } catch (error) {
        failed.push({
          email,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { created, failed };
  }
}
