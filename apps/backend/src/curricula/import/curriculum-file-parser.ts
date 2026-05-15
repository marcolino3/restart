import * as XLSX from 'xlsx';

export interface CurriculumRawRow {
  level: string;
  sequence: number | null;
  area: string | null;
  topic: string | null;
  group: string | null;
  lesson: string | null;
  rowNumber: number;
}

export interface CurriculumParseResult {
  rows: CurriculumRawRow[];
  detectedColumns: Record<string, number>;
  warnings: string[];
}

const COLUMN_ALIASES: Record<
  keyof Omit<CurriculumRawRow, 'rowNumber'>,
  string[]
> = {
  level: ['level', 'stufe', 'niveau', 'livello'],
  sequence: ['sequence', 'seq', 'reihenfolge', 'nr', 'no', 'ordre'],
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

function normalizeHeader(value: unknown): string {
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
    const norm = normalizeHeader(headerRow[i]);
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

export function parseCurriculumFile(
  buffer: Buffer,
  filename: string,
): CurriculumParseResult {
  const ext = filename.toLowerCase().split('.').pop();
  const warnings: string[] = [];

  let sheetData: unknown[][];
  if (ext === 'csv') {
    const text = buffer.toString('utf-8');
    sheetData = parseCsvText(text);
  } else if (ext === 'xlsx' || ext === 'xls') {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      throw new Error('Excel file has no sheets');
    }
    if (wb.SheetNames.length > 1) {
      warnings.push(
        `Only the first sheet "${sheetName}" was imported; ${wb.SheetNames.length - 1} additional sheets ignored`,
      );
    }
    sheetData = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
      header: 1,
      defval: null,
      blankrows: false,
    });
  } else {
    throw new Error(
      `Unsupported file extension ".${ext}". Use .xlsx, .xls or .csv`,
    );
  }

  const headerInfo = findHeaderRow(sheetData);
  if (!headerInfo) {
    throw new Error(
      'Could not detect header row. Expected columns "Level" and "Lesson" within the first 5 rows.',
    );
  }

  const { row: headerRow, columns } = headerInfo;
  const rows: CurriculumRawRow[] = [];

  for (let i = headerRow + 1; i < sheetData.length; i++) {
    const r = sheetData[i] ?? [];
    const level = pickCell(r, columns.level);
    const lesson = pickCell(r, columns.lesson);
    if (!level || !lesson) continue;

    rows.push({
      level,
      sequence: parseSequence(pickCell(r, columns.sequence)),
      area: pickCell(r, columns.area),
      topic: pickCell(r, columns.topic),
      group: pickCell(r, columns.group),
      lesson,
      rowNumber: i + 1,
    });
  }

  if (rows.length === 0) {
    throw new Error('No data rows found after header');
  }

  return { rows, detectedColumns: columns, warnings };
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
