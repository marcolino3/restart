import * as XLSX from 'xlsx';
import { CurriculumLocale } from '../enums/curriculum-locale.enum';
import { parseCurriculumFile } from './curriculum-file-parser';

type Row = (string | number | null)[];

function makeXlsx(sheets: Record<string, Row[]>): Buffer {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

const headerRow: Row = [
  'Sequence',
  'Level',
  'Area',
  'Topic',
  'Group',
  'Lesson',
];

describe('parseCurriculumFile', () => {
  it('single sheet without locale name → master = DE (backwards-compat)', () => {
    const buf = makeXlsx({
      Sheet1: [
        headerRow,
        [1, 'Lower', 'Math', 'Algebra', 'Equations', 'Linear eq.'],
        [2, 'Lower', 'Math', 'Algebra', 'Equations', 'Quadratic eq.'],
      ],
    });
    const result = parseCurriculumFile(buf, 'file.xlsx');
    expect(result.master).toBe(CurriculumLocale.DE);
    expect(result.sheetsByLocale.DE).toHaveLength(2);
    expect(result.sheetsByLocale.DE![0].sequence).toBe(1);
    expect(result.sheetsByLocale.DE![0].lesson).toBe('Linear eq.');
  });

  it('CSV input is treated as single-sheet DE', () => {
    const csv = [
      'Sequence;Level;Area;Topic;Group;Lesson',
      '1;Lower;Math;Algebra;Equations;Linear eq.',
    ].join('\n');
    const result = parseCurriculumFile(Buffer.from(csv, 'utf-8'), 'file.csv');
    expect(result.master).toBe(CurriculumLocale.DE);
    expect(result.sheetsByLocale.DE).toHaveLength(1);
  });

  it('multi-sheet with DE+FR maps both locales', () => {
    const buf = makeXlsx({
      DE: [
        headerRow,
        [1, 'Unterstufe', 'Mathe', 'Algebra', 'Gleichungen', 'Lineare Gl.'],
        [2, 'Unterstufe', 'Mathe', 'Algebra', 'Gleichungen', 'Quadr. Gl.'],
      ],
      FR: [
        headerRow,
        [1, 'Inférieur', 'Maths', 'Algèbre', 'Équations', 'Eq. linéaire'],
        [2, 'Inférieur', 'Maths', 'Algèbre', 'Équations', 'Eq. quadr.'],
      ],
    });
    const result = parseCurriculumFile(buf, 'file.xlsx');
    expect(result.master).toBe(CurriculumLocale.DE);
    expect(result.sheetsByLocale.DE).toHaveLength(2);
    expect(result.sheetsByLocale.FR).toHaveLength(2);
    expect(result.sheetsByLocale.FR![0].lesson).toBe('Eq. linéaire');
  });

  it('sheet name aliases (deutsch / english / italiano) are accepted', () => {
    const buf = makeXlsx({
      deutsch: [headerRow, [1, 'A', 'B', 'C', 'D', 'E']],
      english: [headerRow, [1, 'A', 'B', 'C', 'D', 'E']],
      italiano: [headerRow, [1, 'A', 'B', 'C', 'D', 'E']],
    });
    const result = parseCurriculumFile(buf, 'file.xlsx');
    expect(result.sheetsByLocale.DE).toBeDefined();
    expect(result.sheetsByLocale.EN).toBeDefined();
    expect(result.sheetsByLocale.IT).toBeDefined();
  });

  it('unknown sheet names emit a warning and are ignored', () => {
    const buf = makeXlsx({
      DE: [headerRow, [1, 'A', 'B', 'C', 'D', 'E']],
      Notizen: [headerRow, [1, 'X', 'Y', 'Z', 'Q', 'R']],
    });
    const result = parseCurriculumFile(buf, 'file.xlsx');
    expect(result.sheetsByLocale.DE).toBeDefined();
    expect(Object.keys(result.sheetsByLocale)).toEqual(['DE']);
    expect(result.warnings.some((w) => w.includes('Notizen'))).toBe(true);
  });

  it('throws if multi-sheet file has no DE master', () => {
    const buf = makeXlsx({
      FR: [headerRow, [1, 'A', 'B', 'C', 'D', 'E']],
      EN: [headerRow, [1, 'A', 'B', 'C', 'D', 'E']],
    });
    expect(() => parseCurriculumFile(buf, 'file.xlsx')).toThrow(
      /master sheet/i,
    );
  });

  it('throws on master Sequence duplicates in multi-sheet mode', () => {
    const buf = makeXlsx({
      DE: [
        headerRow,
        [1, 'A', 'B', 'C', 'D', 'E'],
        [1, 'A', 'B', 'C', 'D', 'F'], // duplicate sequence
      ],
      FR: [headerRow, [1, 'Á', 'B́', 'Ć', 'D́', 'É']],
    });
    expect(() => parseCurriculumFile(buf, 'file.xlsx')).toThrow(
      /duplicate.*Sequence/i,
    );
  });

  it('throws when no data rows are found', () => {
    const buf = makeXlsx({ Sheet1: [headerRow] });
    expect(() => parseCurriculumFile(buf, 'file.xlsx')).toThrow(
      /no data rows/i,
    );
  });

  it('unsupported extension throws', () => {
    expect(() => parseCurriculumFile(Buffer.from(''), 'file.txt')).toThrow(
      /Unsupported file extension/,
    );
  });
});
