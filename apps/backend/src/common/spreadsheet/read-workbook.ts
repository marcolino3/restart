import * as XLSX from 'xlsx';

/**
 * Upper bound on the text a single spreadsheet may contribute, mirroring the
 * 5 MB `FileInterceptor` limit the import controllers already enforce. Keeping
 * it here as well means the parser stays bounded on its own, independent of
 * which caller reaches it.
 */
const MAX_TEXT_LENGTH = 5 * 1024 * 1024;

export interface WorkbookSheet {
  name: string;
  rows: unknown[][];
}

/**
 * Reads an uploaded spreadsheet (.xlsx/.xls/.csv) into plain row arrays.
 * Excel date cells are surfaced as JS `Date` objects so callers can format
 * them deterministically instead of guessing the workbook's locale.
 */
export function readWorkbook(
  buffer: Buffer,
  filename: string,
): WorkbookSheet[] {
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
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  return wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
      header: 1,
      defval: null,
      blankrows: false,
    }),
  }));
}

export function toScalarString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return '';
}

export function parseCsvText(text: string): unknown[][] {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error('Spreadsheet content exceeds the supported size limit');
  }
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
