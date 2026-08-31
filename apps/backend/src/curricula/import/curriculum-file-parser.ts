import {
  readWorkbook,
  toScalarString,
} from '@/common/spreadsheet/read-workbook';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';
import {
  CurriculumImportError,
  ImportIssue,
  importIssue,
} from './import-issue';

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
  warnings: ImportIssue[];
}

const REQUIRED_COLUMNS: (keyof typeof COLUMN_ALIASES)[] = ['level', 'lesson'];
const HEADER_SCAN_ROWS = 5;

const COLUMN_ALIASES: Record<
  Exclude<keyof CurriculumRawRow, 'rowNumber'>,
  string[]
> = {
  sequence: ['sequence', 'seq', 'reihenfolge', 'nr', 'no', 'ordre'],
  // "stufe" ist hier bewusst NICHT gelistet: im Schulkontext ist die Stufe die
  // Schulstufe (GradeLevel), nicht die Lehrplan-Gliederungsebene. Eine
  // Importdatei mit Spalte "Stufe" hätte sonst still einen CurriculumLevel
  // angelegt, obwohl der Nutzer die Schulstufe meint. "level" bleibt für
  // bestehende Dateien erhalten.
  level: ['zyklus', 'cycle', 'ciclo', 'level', 'niveau', 'livello'],
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

function detectColumns(headerRow: unknown[]): Record<string, number> {
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
  return found;
}

function hasRequiredColumns(columns: Record<string, number>): boolean {
  return REQUIRED_COLUMNS.every((key) => key in columns);
}

type HeaderSearch =
  | { ok: true; row: number; columns: Record<string, number> }
  | { ok: false; missing: string[]; found: string[] };

/**
 * Scans the first rows for a header. On failure reports which required
 * columns are missing in the best candidate row (the one with the most
 * recognised columns), so the user learns what to rename instead of a
 * generic "no data".
 */
function findHeaderRow(sheet: unknown[][]): HeaderSearch {
  let best: Record<string, number> = {};
  for (let i = 0; i < Math.min(HEADER_SCAN_ROWS, sheet.length); i++) {
    const cols = detectColumns(sheet[i] ?? []);
    if (hasRequiredColumns(cols)) return { ok: true, row: i, columns: cols };
    if (Object.keys(cols).length > Object.keys(best).length) best = cols;
  }
  return {
    ok: false,
    missing: REQUIRED_COLUMNS.filter((key) => !(key in best)),
    found: Object.keys(best),
  };
}

function headerNotFound(sheetName: string, search: HeaderSearch): ImportIssue {
  const missing = search.ok ? [] : search.missing;
  const found = search.ok ? [] : search.found;
  const missingLabel = missing.map(capitalize).join(', ');
  const foundLabel = found.map(capitalize).join(', ');
  return importIssue(
    'HEADER_NOT_FOUND',
    {
      sheet: sheetName,
      missing: missingLabel,
      found: foundLabel,
      scanRows: HEADER_SCAN_ROWS,
    },
    `Sheet "${sheetName}": required column(s) ${missingLabel} not found in the first ${HEADER_SCAN_ROWS} rows` +
      (foundLabel ? ` (recognised: ${foundLabel})` : ''),
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

type SheetParse =
  { ok: true; rows: CurriculumRawRow[] } | { ok: false; issue: ImportIssue };

function parseSheet(sheetName: string, rows: unknown[][]): SheetParse {
  const headerInfo = findHeaderRow(rows);
  if (!headerInfo.ok) {
    return { ok: false, issue: headerNotFound(sheetName, headerInfo) };
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
  if (out.length === 0) {
    return {
      ok: false,
      issue: importIssue(
        'NO_DATA_ROWS',
        { sheet: sheetName, headerRow: headerRow + 1 },
        `Sheet "${sheetName}": no data rows found below the header in row ${headerRow + 1}`,
      ),
    };
  }
  return { ok: true, rows: out };
}

function fail(issue: ImportIssue): never {
  throw new CurriculumImportError(issue.code, issue.params, issue.message);
}

/**
 * The shared workbook reader throws a plain `Error` for an unknown extension,
 * which would reach the client as an untranslatable message. Check it here so
 * the import keeps reporting a structured, localizable issue.
 */
function assertSupportedExtension(filename: string): void {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
    throw new CurriculumImportError(
      'UNSUPPORTED_EXTENSION',
      { extension: `.${ext ?? ''}` },
      `Unsupported file extension ".${ext}". Use .xlsx, .xls or .csv`,
    );
  }
}

export function parseCurriculumFile(
  buffer: Buffer,
  filename: string,
): CurriculumParseResult {
  const warnings: ImportIssue[] = [];
  assertSupportedExtension(filename);
  const sheetData = readWorkbook(buffer, filename);

  if (sheetData.length === 0) {
    throw new CurriculumImportError('NO_SHEETS', {}, 'File has no sheets');
  }

  const sheetsByLocale: SheetsByLocale = {};

  // Single-sheet (or CSV): treat as master = DE regardless of name.
  // Backwards-compat for legacy uploads.
  if (sheetData.length === 1) {
    const parsed = parseSheet(sheetData[0].name, sheetData[0].rows);
    if (!parsed.ok) fail(parsed.issue);
    sheetsByLocale[CurriculumLocale.DE] = parsed.rows;
    return { master: CurriculumLocale.DE, sheetsByLocale, warnings };
  }

  // Multi-sheet: map each sheet name to a locale.
  const matched = new Set<CurriculumLocale>();
  const expectedSheetNames = Object.keys(SHEET_NAME_ALIASES).join(', ');
  for (const sheet of sheetData) {
    const locale = detectSheetLocale(sheet.name);
    if (!locale) {
      warnings.push(
        importIssue(
          'UNKNOWN_SHEET_NAME',
          { sheet: sheet.name, expected: expectedSheetNames },
          `Sheet "${sheet.name}": name is not a language (${expectedSheetNames}), ignored`,
        ),
      );
      continue;
    }
    if (matched.has(locale)) {
      warnings.push(
        importIssue(
          'DUPLICATE_SHEET_LOCALE',
          { sheet: sheet.name, locale },
          `Sheet "${sheet.name}": language ${locale} already imported from an earlier sheet, ignored`,
        ),
      );
      continue;
    }
    const parsed = parseSheet(sheet.name, sheet.rows);
    if (!parsed.ok) {
      // A broken master sheet makes the whole import impossible; a broken
      // translation sheet only loses that language.
      if (locale === CurriculumLocale.DE) fail(parsed.issue);
      warnings.push(parsed.issue);
      continue;
    }
    sheetsByLocale[locale] = parsed.rows;
    matched.add(locale);
  }

  const masterRows = sheetsByLocale[CurriculumLocale.DE];
  if (!masterRows || masterRows.length === 0) {
    const sheetNames = sheetData.map((s) => s.name).join(', ');
    throw new CurriculumImportError(
      'NO_MASTER_SHEET',
      { sheets: sheetNames },
      `No master sheet "DE" found (sheets in file: ${sheetNames}). Name the master sheet "DE" or upload a single-sheet file.`,
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
          importIssue(
            'ROWS_WITHOUT_SEQUENCE',
            { sheet: locale, count: missing.length },
            `Sheet ${locale}: ${missing.length} row(s) without "Sequence" — they cannot be joined across languages and will be ignored for translations`,
          ),
        );
      }
    }
    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const r of masterRows) {
      if (r.sequence === null) continue;
      if (seen.has(r.sequence)) duplicates.add(r.sequence);
      seen.add(r.sequence);
    }
    if (duplicates.size > 0) {
      const values = [...duplicates].slice(0, 10).join(', ');
      throw new CurriculumImportError(
        'DUPLICATE_SEQUENCE',
        { sheet: CurriculumLocale.DE, values, count: duplicates.size },
        `Master sheet (DE) has duplicate "Sequence" values (${values}) — sequences must be unique`,
      );
    }
  }

  return { master: CurriculumLocale.DE, sheetsByLocale, warnings };
}
