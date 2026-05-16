import * as XLSX from 'xlsx';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';

export interface CurriculumRawRow {
  sequence: number | null;
  level: string;
  area: string | null;
  topic: string | null;
  group: string | null;
  lesson: string;
  rowNumber: number;
}

export type SheetsByLocale = Partial<
  Record<CurriculumLocale, CurriculumRawRow[]>
>;

export interface CurriculumParseResult {
  master: CurriculumLocale;
  sheetsByLocale: SheetsByLocale;
  warnings: string[];
}

const COLUMN_ALIASES: Record<
  Exclude<keyof CurriculumRawRow, 'rowNumber'>,
  string[]
> = {
  sequence: ['sequence', 'seq', 'reihenfolge', 'nr', 'no', 'ordre'],
  level: ['level', 'stufe', 'niveau', 'livello'],
  area: ['area', 'bereich', 'domaine', 'ambito'],
  topic: ['topic', 'thema', 'sujet', 'argomento'],
  group: ['group', 'gruppe', 'groupe', 'gruppo'],
  lesson: [
    'lesson',
    'lessons',
    'lektion',
    'lektionen',
    'work',
    'work/lesson',
    'works/lessons',
    'arbeit',
    'travail',
    'lavoro',
  ],
};

const SHEET_NAME_ALIASES: Record<CurriculumLocale, string[]> = {
  [CurriculumLocale.DE]: ['de', 'deutsch', 'german', 'master'],
  [CurriculumLocale.FR]: ['fr', 'francais', 'français', 'french'],
  [CurriculumLocale.IT]: ['it', 'italiano', 'italian', 'italienisch'],
  [CurriculumLocale.EN]: ['en', 'english', 'englisch'],
};

function normalize(value: unknown): string {
  return toScalarString(value).toLowerCase().trim().replace(/\s+/g, ' ');
}

function toScalarString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function detectColumns(headerRow: unknown[]): Record<string, number> | null {
  const found: Record<string, number> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const norm = normalize(headerRow[i]);
    if (!norm) continue;
    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some((a) => norm === a || norm.startsWith(a))) {
        if (!(key in found)) found[key] = i;
      }
    }
  }
  if (!('level' in found) || !('lesson' in found)) return null;
  return found;
}

function findHeaderRow(
  sheet: unknown[][],
  maxScan = 5,
): { row: number; columns: Record<string, number> } | null {
  for (let i = 0; i < Math.min(maxScan, sheet.length); i++) {
    const cols = detectColumns(sheet[i] ?? []);
    if (cols) return { row: i, columns: cols };
  }
  return null;
}

function pickCell(row: unknown[], index: number | undefined): string | null {
  if (index === undefined) return null;
  const value = toScalarString(row[index]).trim();
  return value === '' ? null : value;
}

function parseSequence(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function detectSheetLocale(sheetName: string): CurriculumLocale | null {
  const norm = sheetName.toLowerCase().trim();
  for (const [locale, aliases] of Object.entries(SHEET_NAME_ALIASES)) {
    if (aliases.includes(norm)) return locale as CurriculumLocale;
  }
  return null;
}

function readWorkbook(
  buffer: Buffer,
  filename: string,
): { name: string; rows: unknown[][] }[] {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'csv') {
    const text = buffer.toString('utf-8');
    return [{ name: 'csv', rows: parseCsvText(text) }];
  }
  if (ext !== 'xlsx' && ext !== 'xls') {
    throw new Error(
      `Unsupported file extension ".${ext}". Use .xlsx, .xls or .csv`,
    );
  }
  const wb = XLSX.read(buffer, { type: 'buffer' });
  return wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
      header: 1,
      defval: null,
      blankrows: false,
    }),
  }));
}

function parseSheet(
  sheetName: string,
  rows: unknown[][],
  warnings: string[],
): CurriculumRawRow[] {
  const headerInfo = findHeaderRow(rows);
  if (!headerInfo) {
    warnings.push(
      `Sheet "${sheetName}": Header row not found (expected columns "Level" and "Lesson" within the first 5 rows)`,
    );
    return [];
  }
  const { row: headerRow, columns } = headerInfo;
  const out: CurriculumRawRow[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const level = pickCell(r, columns.level);
    const lesson = pickCell(r, columns.lesson);
    if (!level || !lesson) continue;
    out.push({
      sequence: parseSequence(pickCell(r, columns.sequence)),
      level,
      area: pickCell(r, columns.area),
      topic: pickCell(r, columns.topic),
      group: pickCell(r, columns.group),
      lesson,
      rowNumber: i + 1,
    });
  }
  return out;
}

export function parseCurriculumFile(
  buffer: Buffer,
  filename: string,
): CurriculumParseResult {
  const warnings: string[] = [];
  const sheetData = readWorkbook(buffer, filename);

  if (sheetData.length === 0) {
    throw new Error('File has no sheets');
  }

  const sheetsByLocale: SheetsByLocale = {};

  // Single-sheet (or CSV): treat as master = DE regardless of name.
  // Backwards-compat for legacy uploads.
  if (sheetData.length === 1) {
    const rows = parseSheet(sheetData[0].name, sheetData[0].rows, warnings);
    if (rows.length === 0) {
      throw new Error(
        `Sheet "${sheetData[0].name}" has no data rows after header`,
      );
    }
    sheetsByLocale[CurriculumLocale.DE] = rows;
    return { master: CurriculumLocale.DE, sheetsByLocale, warnings };
  }

  // Multi-sheet: map each sheet name to a locale.
  const matched = new Set<CurriculumLocale>();
  for (const sheet of sheetData) {
    const locale = detectSheetLocale(sheet.name);
    if (!locale) {
      warnings.push(`Sheet "${sheet.name}": unknown locale name, ignored`);
      continue;
    }
    if (matched.has(locale)) {
      warnings.push(
        `Sheet "${sheet.name}": locale ${locale} already imported from an earlier sheet, ignored`,
      );
      continue;
    }
    const rows = parseSheet(sheet.name, sheet.rows, warnings);
    if (rows.length === 0) {
      warnings.push(`Sheet "${sheet.name}" (${locale}) has no data rows`);
      continue;
    }
    sheetsByLocale[locale] = rows;
    matched.add(locale);
  }

  const masterRows = sheetsByLocale[CurriculumLocale.DE];
  if (!masterRows || masterRows.length === 0) {
    throw new Error(
      'No master sheet found. Provide a sheet named "DE" (or use a single sheet without a locale name).',
    );
  }

  // Sequence is required when more than one locale is present, so we can
  // join translations across sheets.
  if (matched.size > 1) {
    for (const [locale, rows] of Object.entries(sheetsByLocale) as [
      CurriculumLocale,
      CurriculumRawRow[],
    ][]) {
      const missing = rows.filter((r) => r.sequence === null);
      if (missing.length > 0) {
        warnings.push(
          `Sheet ${locale}: ${missing.length} row(s) without "Sequence" — they cannot be joined across languages and will be ignored for translations`,
        );
      }
    }
    const masterSeqs = new Set(
      masterRows.filter((r) => r.sequence !== null).map((r) => r.sequence),
    );
    if (masterSeqs.size !== masterRows.filter((r) => r.sequence !== null).length) {
      throw new Error(
        'Master sheet (DE) has duplicate "Sequence" values — sequences must be globally unique',
      );
    }
  }

  return { master: CurriculumLocale.DE, sheetsByLocale, warnings };
}

function parseCsvText(text: string): unknown[][] {
  const lines = text.split(/\r?\n/);
  const separator = guessSeparator(lines[0] ?? '');
  return lines
    .map((line) => parseCsvLine(line, separator))
    .filter((row) => row.some((c) => c !== null && c !== ''));
}

function guessSeparator(headerLine: string): string {
  const counts: Record<string, number> = {
    ';': (headerLine.match(/;/g) ?? []).length,
    ',': (headerLine.match(/,/g) ?? []).length,
    '\t': (headerLine.match(/\t/g) ?? []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best?.[1] && best[1] > 0 ? best[0] : ';';
}

function parseCsvLine(line: string, separator: string): (string | null)[] {
  const out: (string | null)[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === separator && !inQuotes) {
      out.push(current.trim() || null);
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim() || null);
  return out;
}
