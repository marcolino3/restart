import {
  readWorkbook,
  toScalarString,
} from '@/common/spreadsheet/read-workbook';

/**
 * Wide-format student import: one row per child, guardians as fixed column
 * blocks ("Mutter …", "Vater …", "Kontakt 3 …", "Kontakt 4 …") and one
 * family address per row. Headers are accepted in German and English, in any
 * order; unknown columns are reported and ignored.
 */

export type StudentField =
  | 'firstName'
  | 'lastName'
  | 'preferredName'
  | 'dateOfBirth'
  | 'gender'
  | 'placeOfBirth'
  | 'nationalities'
  | 'firstLanguages'
  | 'familyLanguages'
  | 'religion'
  | 'socialSecurityNumber'
  | 'externalStudentId'
  | 'enrollmentDate'
  | 'schoolClass'
  | 'gradeLevel'
  | 'notes';

export type ContactField =
  | 'relationship'
  | 'salutation'
  | 'title'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'mobile'
  | 'occupation'
  | 'preferredLanguages'
  | 'hasCustody'
  | 'isPrimaryContact'
  | 'isPickupAuthorized'
  | 'emergencyPriority'
  | 'livesWithStudent';

export type AddressField =
  'street' | 'houseNumber' | 'postalCode' | 'city' | 'country';

export type ContactBlock = 'mother' | 'father' | 'contact3' | 'contact4';

export type RawStudentValues = Partial<Record<StudentField, string>>;
export type RawContactValues = Partial<Record<ContactField, string>>;
export type RawAddressValues = Partial<Record<AddressField, string>>;

export interface RawContact {
  block: ContactBlock;
  values: RawContactValues;
}

export interface StudentImportRawRow {
  rowNumber: number;
  student: RawStudentValues;
  contacts: RawContact[];
  address: RawAddressValues;
}

export interface StudentImportParseResult {
  rows: StudentImportRawRow[];
  /** Header cells that matched nothing (original spelling). */
  unknownColumns: string[];
  /** Recognised column count per section, for the preview. */
  recognized: {
    student: StudentField[];
    contactBlocks: ContactBlock[];
    address: AddressField[];
  };
}

const STUDENT_ALIASES: Record<StudentField, string[]> = {
  firstName: ['vorname', 'first name', 'firstname', 'prenom'],
  lastName: ['nachname', 'name', 'last name', 'lastname', 'familienname'],
  preferredName: ['rufname', 'preferred name', 'nickname', 'spitzname'],
  dateOfBirth: ['geburtsdatum', 'date of birth', 'birthdate', 'dob', 'geboren'],
  gender: ['geschlecht', 'gender', 'sex'],
  placeOfBirth: ['geburtsort', 'place of birth', 'birthplace'],
  nationalities: [
    'nationalitaet',
    'nationalitaeten',
    'nationality',
    'nationalities',
    'staatsangehoerigkeit',
  ],
  firstLanguages: [
    'erstsprache',
    'erstsprachen',
    'muttersprache',
    'first language',
    'first languages',
    'mother tongue',
  ],
  familyLanguages: [
    'familiensprache',
    'familiensprachen',
    'family language',
    'family languages',
  ],
  religion: ['religion', 'konfession'],
  socialSecurityNumber: [
    'ahv',
    'ahv nummer',
    'ahv nr',
    'sozialversicherungsnummer',
    'social security number',
    'ssn',
  ],
  externalStudentId: [
    'schuelernummer',
    'schueler nr',
    'schueler id',
    'student id',
    'student number',
    'external id',
    'externe id',
    'id',
  ],
  enrollmentDate: [
    'eintrittsdatum',
    'eintritt',
    'enrollment date',
    'entry date',
    'start date',
  ],
  schoolClass: ['klasse', 'class', 'school class', 'schulklasse'],
  gradeLevel: ['stufe', 'schulstufe', 'grade level', 'grade', 'level'],
  notes: [
    'notizen',
    'bemerkungen',
    'bemerkung',
    'notes',
    'remarks',
    'kommentar',
  ],
};

const CONTACT_ALIASES: Record<ContactField, string[]> = {
  relationship: ['beziehung', 'relationship', 'relation', 'rolle', 'role'],
  salutation: ['anrede', 'salutation'],
  title: ['titel', 'title'],
  firstName: ['vorname', 'first name', 'firstname'],
  lastName: ['nachname', 'name', 'last name', 'lastname'],
  email: ['e mail', 'email', 'mail'],
  phone: ['telefon', 'phone', 'tel', 'festnetz'],
  mobile: ['mobile', 'mobil', 'handy', 'natel', 'cell'],
  occupation: ['beruf', 'occupation', 'job'],
  preferredLanguages: [
    'sprache',
    'sprachen',
    'language',
    'languages',
    'korrespondenzsprache',
  ],
  hasCustody: ['sorgerecht', 'custody', 'has custody', 'erziehungsberechtigt'],
  isPrimaryContact: ['hauptkontakt', 'primary contact', 'primary', 'primaer'],
  isPickupAuthorized: [
    'abholberechtigt',
    'abholung',
    'pickup',
    'pickup authorized',
    'pick up',
  ],
  emergencyPriority: [
    'notfallprioritaet',
    'notfall',
    'emergency priority',
    'emergency',
  ],
  livesWithStudent: [
    'wohnt bei kind',
    'wohnt beim kind',
    'lebt mit kind',
    'lives with student',
    'lives with child',
    'lives with',
  ],
};

const ADDRESS_ALIASES: Record<AddressField, string[]> = {
  street: ['strasse', 'street', 'adresse', 'address'],
  houseNumber: ['hausnummer', 'haus nr', 'nr', 'house number', 'number', 'no'],
  postalCode: [
    'plz',
    'postleitzahl',
    'postal code',
    'zip',
    'zip code',
    'postcode',
  ],
  city: ['ort', 'stadt', 'wohnort', 'city', 'town'],
  country: ['land', 'country'],
};

const BLOCK_PREFIXES: Record<ContactBlock, string[]> = {
  mother: ['mutter', 'mother', 'mum', 'mom'],
  father: ['vater', 'father', 'dad'],
  contact3: [
    'kontakt 3',
    'kontakt3',
    'contact 3',
    'contact3',
    'kontaktperson 3',
    'contact person 3',
  ],
  contact4: [
    'kontakt 4',
    'kontakt4',
    'contact 4',
    'contact4',
    'kontaktperson 4',
    'contact person 4',
  ],
};

const ADDRESS_PREFIXES = ['adresse', 'address', 'familie', 'family'];

export function normalizeHeader(value: unknown): string {
  return toScalarString(value)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[_\-./:()*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ColumnMap {
  student: Partial<Record<StudentField, number>>;
  contacts: Partial<
    Record<ContactBlock, Partial<Record<ContactField, number>>>
  >;
  address: Partial<Record<AddressField, number>>;
  unknown: string[];
}

function matchAlias<K extends string>(
  norm: string,
  aliases: Record<K, string[]>,
): K | null {
  // Exact match first, then longest alias that is a prefix of the header
  // ("geburtsdatum kind" → dateOfBirth). Longest wins so "first languages"
  // beats "first name" style collisions never happen on shared prefixes.
  let best: { key: K; len: number } | null = null;
  for (const [key, list] of Object.entries(aliases) as [K, string[]][]) {
    for (const alias of list) {
      if (norm === alias) return key;
      if (
        norm.startsWith(`${alias} `) &&
        (best === null || alias.length > best.len)
      ) {
        best = { key, len: alias.length };
      }
    }
  }
  return best?.key ?? null;
}

function stripPrefix(norm: string, prefixes: string[]): string | null {
  for (const prefix of prefixes) {
    if (norm === prefix) return '';
    if (norm.startsWith(`${prefix} `)) return norm.slice(prefix.length + 1);
  }
  return null;
}

export function detectColumns(headerRow: unknown[]): ColumnMap {
  const map: ColumnMap = {
    student: {},
    contacts: {},
    address: {},
    unknown: [],
  };
  for (let i = 0; i < headerRow.length; i++) {
    const original = toScalarString(headerRow[i]).trim();
    const norm = normalizeHeader(original);
    if (!norm) continue;

    let matched = false;
    for (const [block, prefixes] of Object.entries(BLOCK_PREFIXES) as [
      ContactBlock,
      string[],
    ][]) {
      const rest = stripPrefix(norm, prefixes);
      if (rest === null) continue;
      const field = rest === '' ? null : matchAlias(rest, CONTACT_ALIASES);
      if (field) {
        const blockMap = (map.contacts[block] ??= {});
        if (!(field in blockMap)) blockMap[field] = i;
        matched = true;
      }
      break;
    }
    if (matched) continue;

    const addressRest = stripPrefix(norm, ADDRESS_PREFIXES);
    const addressField =
      addressRest !== null && addressRest !== ''
        ? matchAlias(addressRest, ADDRESS_ALIASES)
        : matchAlias(norm, ADDRESS_ALIASES);
    // Bare "name"/"nr" must stay student/house-number safe: only accept an
    // unprefixed address field when it is not also a student alias.
    const studentField = matchAlias(norm, STUDENT_ALIASES);
    if (studentField && !(studentField in map.student)) {
      map.student[studentField] = i;
      continue;
    }
    if (addressField && !(addressField in map.address)) {
      map.address[addressField] = i;
      continue;
    }
    if (!studentField) map.unknown.push(original);
  }
  return map;
}

function findHeaderRow(
  rows: unknown[][],
  maxScan = 5,
): { row: number; columns: ColumnMap } | null {
  for (let i = 0; i < Math.min(maxScan, rows.length); i++) {
    const columns = detectColumns(rows[i] ?? []);
    if ('firstName' in columns.student && 'lastName' in columns.student) {
      return { row: i, columns };
    }
  }
  return null;
}

function pick(row: unknown[], index: number | undefined): string | undefined {
  if (index === undefined) return undefined;
  const value = toScalarString(row[index]).trim();
  return value === '' ? undefined : value;
}

function pickAll<K extends string>(
  row: unknown[],
  map: Partial<Record<K, number>>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const [key, index] of Object.entries(map) as [K, number][]) {
    const value = pick(row, index);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function parseStudentImportFile(
  buffer: Buffer,
  filename: string,
): StudentImportParseResult {
  const sheets = readWorkbook(buffer, filename);
  if (sheets.length === 0) throw new Error('File has no sheets');

  // First sheet with a recognisable header wins; extra sheets are ignored.
  let header: { row: number; columns: ColumnMap } | null = null;
  let rows: unknown[][] = [];
  for (const sheet of sheets) {
    header = findHeaderRow(sheet.rows);
    if (header) {
      rows = sheet.rows;
      break;
    }
  }
  if (!header) {
    throw new Error(
      'Header row not found: the file needs at least the columns "Vorname" and "Nachname" (or "First name" / "Last name") within the first 5 rows',
    );
  }
  const { columns } = header;

  const out: StudentImportRawRow[] = [];
  for (let i = header.row + 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const student = pickAll<StudentField>(r, columns.student);
    const contacts: RawContact[] = [];
    for (const [block, fields] of Object.entries(columns.contacts) as [
      ContactBlock,
      Partial<Record<ContactField, number>>,
    ][]) {
      const values = pickAll<ContactField>(r, fields);
      if (Object.keys(values).length > 0) contacts.push({ block, values });
    }
    const address = pickAll<AddressField>(r, columns.address);
    if (
      Object.keys(student).length === 0 &&
      contacts.length === 0 &&
      Object.keys(address).length === 0
    ) {
      continue;
    }
    out.push({ rowNumber: i + 1, student, contacts, address });
  }

  return {
    rows: out,
    unknownColumns: columns.unknown,
    recognized: {
      student: Object.keys(columns.student) as StudentField[],
      contactBlocks: Object.keys(columns.contacts) as ContactBlock[],
      address: Object.keys(columns.address) as AddressField[],
    },
  };
}
