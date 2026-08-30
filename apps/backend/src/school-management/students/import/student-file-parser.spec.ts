import { parseStudentImportFile } from './student-file-parser';

function csv(lines: string[]): Buffer {
  return Buffer.from(lines.join('\n'), 'utf-8');
}

describe('parseStudentImportFile', () => {
  it('parses German headers with mother/father blocks', () => {
    const file = csv([
      'Vorname;Nachname;Geburtsdatum;Klasse;Mutter Vorname;Mutter Nachname;Mutter E-Mail;Vater Vorname;Vater Nachname;Vater E-Mail;Strasse;PLZ;Ort',
      'Lena;Müller;12.03.2018;Blau;Anna;Müller;anna@example.com;Peter;Müller;peter@example.com;Bahnhofstrasse;8001;Zürich',
    ]);

    const result = parseStudentImportFile(file, 'schueler.csv');

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.student).toMatchObject({
      firstName: 'Lena',
      lastName: 'Müller',
      dateOfBirth: '12.03.2018',
      schoolClass: 'Blau',
    });
    expect(row.contacts).toHaveLength(2);
    expect(row.contacts[0]).toMatchObject({
      block: 'mother',
      values: { firstName: 'Anna', email: 'anna@example.com' },
    });
    expect(row.contacts[1].block).toBe('father');
    expect(row.address).toMatchObject({
      street: 'Bahnhofstrasse',
      postalCode: '8001',
      city: 'Zürich',
    });
  });

  it('accepts English headers and arbitrary column order', () => {
    const file = csv([
      'Last name;Mother email;First name;Mother first name;Mother last name',
      'Rossi;laura@example.com;Sofia;Laura;Rossi',
    ]);

    const result = parseStudentImportFile(file, 'students.csv');

    expect(result.rows[0].student).toMatchObject({
      firstName: 'Sofia',
      lastName: 'Rossi',
    });
    expect(result.rows[0].contacts[0].values).toMatchObject({
      firstName: 'Laura',
      lastName: 'Rossi',
      email: 'laura@example.com',
    });
  });

  it('reads contact 3/4 blocks including their relationship column', () => {
    const file = csv([
      'Vorname;Nachname;Kontakt 3 Beziehung;Kontakt 3 Vorname;Kontakt 3 Nachname',
      'Tim;Keller;Grossmutter;Rita;Keller',
    ]);

    const contacts = parseStudentImportFile(file, 'x.csv').rows[0].contacts;

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      block: 'contact3',
      values: { relationship: 'Grossmutter', firstName: 'Rita' },
    });
  });

  it('reports unknown columns instead of failing', () => {
    const file = csv(['Vorname;Nachname;Lieblingsfarbe', 'Tim;Keller;Blau']);

    const result = parseStudentImportFile(file, 'x.csv');

    expect(result.unknownColumns).toEqual(['Lieblingsfarbe']);
    expect(result.rows).toHaveLength(1);
  });

  it('skips empty contact blocks', () => {
    const file = csv([
      'Vorname;Nachname;Mutter Vorname;Mutter Nachname;Vater Vorname;Vater Nachname',
      'Tim;Keller;Anna;Keller;;',
    ]);

    expect(parseStudentImportFile(file, 'x.csv').rows[0].contacts).toHaveLength(
      1,
    );
  });

  it('throws when the name columns are missing', () => {
    const file = csv(['Klasse;Geburtsdatum', 'Blau;12.03.2018']);

    expect(() => parseStudentImportFile(file, 'x.csv')).toThrow(
      /Header row not found/,
    );
  });

  it('finds the header row when preceded by title rows', () => {
    const file = csv([
      'Schülerliste Testschule',
      '',
      'Vorname;Nachname',
      'Tim;Keller',
    ]);

    const result = parseStudentImportFile(file, 'x.csv');

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rowNumber).toBe(3);
  });
});
