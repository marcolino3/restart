import { EMPLOYEE_CSV_MAX_BYTES, parseEmployeeCsv } from './employee-csv';

describe('employee CSV', () => {
  const header = 'email;firstName;lastName';
  it('handles BOM, CRLF, escaped quotes, semicolons and quoted newlines', () => {
    expect(
      parseEmployeeCsv(
        '\uFEFF' + header + '\r\na@example.test;"A; B";"C""D\nE"\r\n',
      ),
    ).toEqual([
      { email: 'a@example.test', firstName: 'A; B', lastName: 'C"D\nE' },
    ]);
  });
  it.each([
    '',
    header,
    'email;firstName\na@b.ch;A',
    'email;firstName;lastName;email\na@b.ch;A;B;a@b.ch',
    header + ';unknown\na@b.ch;A;B;X',
    header + '\na@b.ch;A',
    header + '\na@b.ch;A;B;C',
    header + '\na@b.ch;"A;B',
    header + '\na@b.ch;A";B',
    header + '\na@b.ch;"A"x;B',
  ])('rejects malformed structure %#', (csv) => {
    expect(() => parseEmployeeCsv(csv)).toThrow();
  });
  it('accepts exactly 1000 data rows and rejects an additional row', () => {
    const csv = header + '\n' + 'a@b.ch;A;B\n'.repeat(1000);
    expect(parseEmployeeCsv(csv)).toHaveLength(1000);
    expect(() => parseEmployeeCsv(csv + 'c@b.ch;C;D')).toThrow('1000');
  });
  it('counts UTF-8 bytes, not characters', () => {
    expect(() =>
      parseEmployeeCsv('é'.repeat(EMPLOYEE_CSV_MAX_BYTES / 2 + 1)),
    ).toThrow('5 MiB');
  });
});
