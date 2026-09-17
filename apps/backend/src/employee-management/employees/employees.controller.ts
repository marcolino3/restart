import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeesService } from './employees.service';
import { parseEmployeeCsv, EMPLOYEE_CSV_MAX_BYTES } from './employee-csv';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { Persona } from '@/common/enums/persona.enum';

interface UploadResult {
  created: { email: string }[];
  failed: { row: number; email: string; reason: string }[];
}

const VALID_PERSONAS = new Set(Object.values(Persona));

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post('upload')
  @UseGuards(BetterAuthGuard)
  @Permissions('EMPLOYEE_WRITE')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: EMPLOYEE_CSV_MAX_BYTES, files: 1, fields: 0 },
    }),
  )
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: TokenPayload,
  ): Promise<UploadResult> {
    if (!file) throw new BadRequestException('No file provided');

    const orgId = user.orgId;
    if (!orgId) throw new BadRequestException('No organization selected');

    const text = file.buffer.toString('utf-8');
    const rows = parseEmployeeCsv(text);

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    const created: { email: string }[] = [];
    const failed: { row: number; email: string; reason: string }[] = [];

    const seen = new Set<string>();
    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const email = row.email?.trim().toLowerCase();
      if (!email) {
        failed.push({
          row: rowNumber,
          email: '(empty)',
          reason: 'Email is required',
        });
        continue;
      }

      if (seen.has(email)) {
        failed.push({
          row: rowNumber,
          email,
          reason: 'Duplicate email in CSV',
        });
        continue;
      }
      seen.add(email);

      const personaRaw = row.persona?.trim().toUpperCase();
      const persona = VALID_PERSONAS.has(personaRaw as Persona)
        ? (personaRaw as Persona)
        : Persona.EMPLOYEE;

      try {
        const input = plainToInstance(CreateEmployeeInput, {
          email,
          firstName: row.firstName?.trim() || '',
          lastName: row.lastName?.trim() || '',
          persona,
          title: row.title?.trim() || undefined,
          contactPhone: row.contactPhone?.trim() || undefined,
          dateOfBirth: row.dateOfBirth?.trim() || undefined,
        });
        if (personaRaw && !VALID_PERSONAS.has(personaRaw as Persona)) {
          failed.push({ row: rowNumber, email, reason: 'Invalid persona' });
          continue;
        }
        const errors = validateSync(input);
        if (errors.length) {
          failed.push({
            row: rowNumber,
            email,
            reason: `Invalid fields: ${errors.map((e) => e.property).join(', ')}`,
          });
          continue;
        }
        await this.employeesService.createEmployeeMinimal(input, orgId);
        created.push({ email });
      } catch {
        failed.push({
          row: rowNumber,
          email,
          reason: 'Employee could not be created',
        });
      }
    }

    return { created, failed };
  }
}
