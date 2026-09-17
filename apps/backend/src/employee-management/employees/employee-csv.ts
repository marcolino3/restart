import { BadRequestException } from '@nestjs/common';

export const EMPLOYEE_CSV_MAX_BYTES = 5 * 1024 * 1024;
export const EMPLOYEE_CSV_MAX_ROWS = 1000;
const HEADERS = [
  'email',
  'firstName',
  'lastName',
  'title',
  'persona',
  'contactPhone',
  'dateOfBirth',
];

/** Semicolon CSV, including escaped quotes, BOM and quoted newlines. Parse fully before writes. */
export function parseEmployeeCsv(text: string): Record<string, string>[] {
  if (Buffer.byteLength(text, 'utf8') > EMPLOYEE_CSV_MAX_BYTES) {
    throw new BadRequestException('CSV exceeds 5 MiB');
  }
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let closed = false;
  const finishField = () => {
    row.push(field.trim());
    field = '';
    closed = false;
  };
  const finishRow = () => {
    finishField();
    if (row.some(Boolean)) records.push(row);
    row = [];
    if (records.length > EMPLOYEE_CSV_MAX_ROWS + 1)
      throw new BadRequestException('CSV exceeds 1000 data rows');
  };
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += char;
    } else if (char === ';') finishField();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      finishRow();
    } else if (char === '"' && field === '' && !closed) quoted = true;
    else {
      if (char === '"' || (closed && char.trim()))
        throw new BadRequestException('Malformed CSV quoting');
      field += char;
    }
  }
  if (quoted) throw new BadRequestException('Unclosed CSV quote');
  if (field || row.length || closed) finishRow();
  const headers = records.shift();
  if (!headers || !records.length)
    throw new BadRequestException('CSV file is empty or has no data rows');
  if (
    new Set(headers).size !== headers.length ||
    headers.some((h) => !HEADERS.includes(h)) ||
    ['email', 'firstName', 'lastName'].some((h) => !headers.includes(h))
  ) {
    throw new BadRequestException(
      'CSV requires unique supported headers including email, firstName and lastName',
    );
  }
  return records.map((values) => {
    if (values.length !== headers.length)
      throw new BadRequestException('CSV column count does not match headers');
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}
