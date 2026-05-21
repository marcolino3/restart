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
import { ContactPersonsService } from './contact-persons.service';
import { Salutation } from './enums/salutation.enum';
import { RelationshipType } from './enums/relationship-type.enum';

interface CsvRow {
  salutation?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  occupation?: string;
  roles?: string;
  nationalities?: string;
  preferredLanguages?: string;
  notes?: string;
}

interface UploadResult {
  created: { name: string }[];
  failed: { name: string; reason: string }[];
}

const VALID_SALUTATIONS = new Set(Object.values(Salutation));
const VALID_RELATIONSHIP_TYPES = new Set(Object.values(RelationshipType));

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
    return row;
  });
}

function parsePipeList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean);
}

@Controller('contact-persons')
export class ContactPersonsController {
  constructor(private readonly contactPersonsService: ContactPersonsService) {}

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

      const salutationRaw = row.salutation?.trim().toUpperCase();
      const salutation = VALID_SALUTATIONS.has(salutationRaw as Salutation)
        ? (salutationRaw as Salutation)
        : undefined;

      const rolesRaw = parsePipeList(row.roles);
      const roles = rolesRaw.filter((r) =>
        VALID_RELATIONSHIP_TYPES.has(r as RelationshipType),
      ) as RelationshipType[];

      const nationalities = parsePipeList(row.nationalities);
      const preferredLanguages = parsePipeList(row.preferredLanguages);

      try {
        await this.contactPersonsService.create(
          {
            firstName,
            lastName,
            salutation,
            email: row.email?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            mobile: row.mobile?.trim() || undefined,
            dateOfBirth: row.dateOfBirth?.trim() || undefined,
            occupation: row.occupation?.trim() || undefined,
            roles: roles.length > 0 ? roles : undefined,
            nationalities: nationalities.length > 0 ? nationalities : undefined,
            preferredLanguages:
              preferredLanguages.length > 0 ? preferredLanguages : undefined,
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
