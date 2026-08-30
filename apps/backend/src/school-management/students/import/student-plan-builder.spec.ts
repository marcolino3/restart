import { Gender } from '@/database/enums/gender.enum';
import { RelationshipType } from '../../contact-persons/enums/relationship-type.enum';
import {
  StudentImportIssueCode,
  StudentImportIssueSeverity,
} from './dto/student-import-plan.types';
import { parseStudentImportFile } from './student-file-parser';
import {
  buildStudentImportPlan,
  INVALID_DATE,
  parseDate,
  type ExistingData,
} from './student-plan-builder';

const EMPTY: ExistingData = {
  students: [],
  contacts: [],
  schoolClasses: [],
  gradeLevels: [],
  countries: [],
};

function plan(lines: string[], existing: Partial<ExistingData> = {}) {
  const parsed = parseStudentImportFile(
    Buffer.from(lines.join('\n'), 'utf-8'),
    'x.csv',
  );
  return buildStudentImportPlan(parsed, { ...EMPTY, ...existing });
}

const HEADER =
  'Vorname;Nachname;Geburtsdatum;Geschlecht;Klasse;Mutter Vorname;Mutter Nachname;Mutter E-Mail;Vater Vorname;Vater Nachname;Vater E-Mail;Strasse;PLZ;Ort';

describe('parseDate', () => {
  it.each([
    ['2018-03-12', '2018-03-12'],
    ['12.03.2018', '2018-03-12'],
    ['1.3.2018', '2018-03-01'],
    ['12/03/2018', '2018-03-12'],
  ])('parses %s', (input, expected) => {
    expect(parseDate(input)).toBe(expected);
  });

  it('rejects impossible dates', () => {
    expect(parseDate('31.02.2018')).toBe(INVALID_DATE);
    expect(parseDate('foo')).toBe(INVALID_DATE);
  });

  it('returns null for empty input', () => {
    expect(parseDate(undefined)).toBeNull();
  });
});

describe('buildStudentImportPlan', () => {
  it('normalises a child with both parents', () => {
    const result = plan([
      HEADER,
      'Lena;Müller;12.03.2018;weiblich;Blau;Anna;Müller;anna@example.com;Peter;Müller;peter@example.com;Bahnhofstrasse;8001;Zürich',
    ]);

    expect(result.students).toHaveLength(1);
    expect(result.students[0]).toMatchObject({
      firstName: 'Lena',
      dateOfBirth: '2018-03-12',
      gender: Gender.FEMALE,
      existingStudentId: null,
    });
    expect(result.contacts).toHaveLength(2);
    expect(result.families).toHaveLength(1);
    expect(result.students[0].links.map((l) => l.relationshipType)).toEqual([
      RelationshipType.MOTHER,
      RelationshipType.FATHER,
    ]);
  });

  it('merges siblings onto one family and one contact per parent', () => {
    const result = plan([
      HEADER,
      'Lena;Müller;12.03.2018;w;Blau;Anna;Müller;anna@example.com;Peter;Müller;peter@example.com;Bahnhofstrasse;8001;Zürich',
      'Tim;Müller;05.09.2020;m;Rot;Anna;Müller;anna@example.com;Peter;Müller;peter@example.com;Bahnhofstrasse;8001;Zürich',
    ]);

    expect(result.students).toHaveLength(2);
    expect(result.contacts).toHaveLength(2);
    expect(result.families).toHaveLength(1);
    expect(result.stats.mergedContactCount).toBe(2);
    expect(result.students[0].familyKey).toBe(result.students[1].familyKey);
    // Both children link to the same two contact records.
    const contactIds = new Set(
      result.students.flatMap((s) => s.links.map((l) => l.contactTempId)),
    );
    expect(contactIds.size).toBe(2);
  });

  it('keeps same-named parents apart when addresses differ', () => {
    const result = plan([
      HEADER,
      'Lena;Müller;12.03.2018;w;Blau;Anna;Müller;;Peter;Müller;;Bahnhofstrasse;8001;Zürich',
      'Nina;Müller;01.02.2019;w;Blau;Anna;Müller;;Peter;Müller;;Seeweg;9000;St. Gallen',
    ]);

    expect(result.contacts).toHaveLength(4);
    expect(result.families).toHaveLength(2);
  });

  it('merges same-named parents living at the same address', () => {
    const result = plan([
      HEADER,
      'Lena;Müller;12.03.2018;w;Blau;Anna;Müller;;Peter;Müller;;Bahnhofstrasse;8001;Zürich',
      'Tim;Müller;05.09.2020;m;Rot;Anna;Müller;;Peter;Müller;;Bahnhofstrasse;8001;Zürich',
    ]);

    expect(result.contacts).toHaveLength(2);
    expect(result.families).toHaveLength(1);
  });

  it('warns about possible duplicates when no contact data is present', () => {
    const result = plan([
      'Vorname;Nachname;Mutter Vorname;Mutter Nachname',
      'Lena;Müller;Anna;Müller',
      'Nina;Meier;Anna;Müller',
    ]);

    expect(result.contacts).toHaveLength(2);
    const issue = result.issues.find(
      (i) => i.code === StudentImportIssueCode.POSSIBLE_DUPLICATE_CONTACT,
    );
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe(StudentImportIssueSeverity.WARNING);
    expect(issue?.relatedRowNumbers).toEqual([2, 3]);
  });

  it('merges by phone when e-mail is missing', () => {
    const result = plan([
      'Vorname;Nachname;Mutter Vorname;Mutter Nachname;Mutter Mobile',
      'Lena;Müller;Anna;Müller;+41 79 123 45 67',
      'Tim;Müller;Anna;Müller;079 123 45 67',
    ]);

    expect(result.contacts).toHaveLength(1);
    expect(result.families).toHaveLength(1);
  });

  it('matches an existing student by name and date of birth', () => {
    const result = plan([HEADER, 'Lena;Müller;12.03.2018;w;Blau;;;;;;;;;'], {
      students: [
        {
          id: 'student-1',
          firstName: 'Lena',
          lastName: 'Müller',
          dateOfBirth: '2018-03-12',
        },
      ],
    });

    expect(result.students[0].existingStudentId).toBe('student-1');
    expect(result.stats.existingStudentCount).toBe(1);
    expect(result.stats.newStudentCount).toBe(0);
  });

  it('matches an existing student by external id even without a birth date', () => {
    const result = plan(
      ['Vorname;Nachname;Schülernummer', 'Lena;Müller;S-42'],
      {
        students: [
          {
            id: 'student-9',
            firstName: 'Anders',
            lastName: 'Geschrieben',
            externalStudentId: 'S-42',
          },
        ],
      },
    );

    expect(result.students[0].existingStudentId).toBe('student-9');
  });

  it('reuses the family of an existing matched contact', () => {
    const result = plan(
      [
        'Vorname;Nachname;Mutter Vorname;Mutter Nachname;Mutter E-Mail',
        'Lena;Müller;Anna;Müller;anna@example.com',
      ],
      {
        contacts: [
          {
            id: 'contact-1',
            firstName: 'Anna',
            lastName: 'Müller',
            email: 'Anna@Example.com',
            familyId: 'family-1',
          },
        ],
      },
    );

    expect(result.contacts[0].existingContactPersonId).toBe('contact-1');
    expect(result.families[0].existingFamilyId).toBe('family-1');
  });

  it('resolves school classes and warns about unknown ones', () => {
    const result = plan(
      ['Vorname;Nachname;Klasse', 'Lena;Müller;Blau', 'Tim;Keller;Violett'],
      { schoolClasses: [{ id: 'class-1', name: 'blau' }] },
    );

    expect(result.students[0].schoolClassId).toBe('class-1');
    expect(result.students[1].schoolClassId).toBeNull();
    expect(
      result.issues.some(
        (i) =>
          i.code === StudentImportIssueCode.UNKNOWN_SCHOOL_CLASS &&
          i.value === 'Violett',
      ),
    ).toBe(true);
  });

  it('errors on rows without a name and keeps the other rows', () => {
    const result = plan([
      'Vorname;Nachname;Klasse',
      ';Müller;Blau',
      'Tim;Keller;Blau',
    ]);

    expect(result.students).toHaveLength(1);
    expect(result.stats.errorCount).toBe(1);
    expect(result.issues[0].code).toBe(
      StudentImportIssueCode.MISSING_FIRST_NAME,
    );
  });

  it('maps relationship aliases and defaults custody for parents', () => {
    const result = plan([
      'Vorname;Nachname;Kontakt 3 Beziehung;Kontakt 3 Vorname;Kontakt 3 Nachname;Kontakt 3 Sorgerecht',
      'Sofia;Rossi;Stiefvater;Marc;Keller;nein',
    ]);

    const link = result.students[0].links[0];
    expect(link.relationshipType).toBe(RelationshipType.STEP_FATHER);
    expect(link.hasCustody).toBe(false);
    // First contact becomes the primary contact when none is marked.
    expect(link.isPrimaryContact).toBe(true);
  });

  it('warns on an unparsable relationship and falls back to OTHER', () => {
    const result = plan([
      'Vorname;Nachname;Kontakt 3 Beziehung;Kontakt 3 Vorname;Kontakt 3 Nachname',
      'Sofia;Rossi;Zauberer;Marc;Keller',
    ]);

    expect(result.students[0].links[0].relationshipType).toBe(
      RelationshipType.OTHER,
    );
    expect(
      result.issues.some(
        (i) => i.code === StudentImportIssueCode.INVALID_RELATIONSHIP,
      ),
    ).toBe(true);
  });

  it('warns when a merged contact carries conflicting data', () => {
    const result = plan([
      'Vorname;Nachname;Mutter Vorname;Mutter Nachname;Mutter E-Mail;Mutter Telefon',
      'Lena;Müller;Anna;Müller;anna@example.com;044 111 22 33',
      'Tim;Müller;Anna;Müller;anna@example.com;044 999 88 77',
    ]);

    expect(result.contacts).toHaveLength(1);
    expect(
      result.issues.some(
        (i) => i.code === StudentImportIssueCode.CONTACT_DATA_CONFLICT,
      ),
    ).toBe(true);
  });

  it('keeps only one primary contact per student', () => {
    const result = plan([
      'Vorname;Nachname;Mutter Vorname;Mutter Nachname;Mutter Hauptkontakt;Vater Vorname;Vater Nachname;Vater Hauptkontakt',
      'Lena;Müller;Anna;Müller;ja;Peter;Müller;ja',
    ]);

    const primaries = result.students[0].links.filter(
      (l) => l.isPrimaryContact,
    );
    expect(primaries).toHaveLength(1);
    expect(primaries[0].relationshipType).toBe(RelationshipType.MOTHER);
  });

  it('flags duplicate children inside the file', () => {
    const result = plan([
      'Vorname;Nachname;Geburtsdatum',
      'Lena;Müller;12.03.2018',
      'Lena;Müller;12.03.2018',
    ]);

    expect(
      result.issues.some(
        (i) => i.code === StudentImportIssueCode.DUPLICATE_STUDENT_IN_FILE,
      ),
    ).toBe(true);
  });

  it('splits list columns on ; | and /', () => {
    const result = plan([
      'Vorname;Nachname;Nationalität;Erstsprache',
      'Lena;Müller;CH|DE;Deutsch / Französisch',
    ]);

    expect(result.students[0].nationalities).toEqual(['CH', 'DE']);
    expect(result.students[0].firstLanguages).toEqual([
      'Deutsch',
      'Französisch',
    ]);
  });

  it('reports unknown columns as warnings', () => {
    const result = plan([
      'Vorname;Nachname;Lieblingsfarbe',
      'Lena;Müller;Blau',
    ]);

    expect(
      result.issues.some(
        (i) =>
          i.code === StudentImportIssueCode.UNKNOWN_COLUMN &&
          i.value === 'Lieblingsfarbe',
      ),
    ).toBe(true);
  });
});
