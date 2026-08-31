import { Gender } from '@/database/enums/gender.enum';
import { RelationshipType } from '../../contact-persons/enums/relationship-type.enum';
import { Salutation } from '../../contact-persons/enums/salutation.enum';
import {
  StudentImportIssueCode,
  StudentImportIssueSeverity,
} from './dto/student-import-plan.types';
import type {
  ContactBlock,
  RawContactValues,
  StudentImportParseResult,
  StudentImportRawRow,
} from './student-file-parser';

export interface BuilderIssue {
  severity: StudentImportIssueSeverity;
  code: StudentImportIssueCode;
  rowNumber?: number | null;
  column?: string | null;
  value?: string | null;
  relatedRowNumbers?: number[] | null;
}

export interface PlanAddress {
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  countryId?: string | null;
  countryName?: string | null;
}

export interface PlanFamily {
  key: string;
  name: string;
  address?: PlanAddress | null;
  existingFamilyId?: string | null;
}

export interface PlanContact {
  tempId: string;
  familyKey: string;
  existingContactPersonId?: string | null;
  salutation?: Salutation | null;
  title?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  occupation?: string | null;
  preferredLanguages: string[];
  roles: RelationshipType[];
  sourceRowNumbers: number[];
}

export interface PlanLink {
  contactTempId: string;
  relationshipType: RelationshipType;
  isPrimaryContact: boolean;
  hasCustody: boolean;
  isPickupAuthorized: boolean;
  emergencyPriority?: number | null;
  livesWithStudent: boolean;
}

export interface PlanStudent {
  tempId: string;
  sourceRowNumber: number;
  familyKey: string;
  existingStudentId?: string | null;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  placeOfBirth?: string | null;
  nationalities: string[];
  firstLanguages: string[];
  familyLanguages: string[];
  religion?: string | null;
  socialSecurityNumber?: string | null;
  externalStudentId?: string | null;
  enrollmentDate?: string | null;
  notes?: string | null;
  schoolClassId?: string | null;
  schoolClassName?: string | null;
  gradeLevelId?: string | null;
  gradeLevelName?: string | null;
  links: PlanLink[];
}

export interface StudentImportPlan {
  students: PlanStudent[];
  contacts: PlanContact[];
  families: PlanFamily[];
  issues: BuilderIssue[];
  stats: {
    rowCount: number;
    newStudentCount: number;
    existingStudentCount: number;
    newContactCount: number;
    existingContactCount: number;
    mergedContactCount: number;
    familyCount: number;
    errorCount: number;
    warningCount: number;
  };
}

/** Existing org data the builder matches against. */
export interface ExistingData {
  students: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    externalStudentId?: string | null;
  }[];
  contacts: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    familyId?: string | null;
  }[];
  schoolClasses: { id: string; name: string }[];
  gradeLevels: { id: string; name: string }[];
  countries: { id: string; name: string; isoCode?: string | null }[];
}

const BLOCK_DEFAULT_RELATIONSHIP: Record<
  ContactBlock,
  RelationshipType | null
> = {
  mother: RelationshipType.MOTHER,
  father: RelationshipType.FATHER,
  contact3: null,
  contact4: null,
};

const RELATIONSHIP_ALIASES: Record<string, RelationshipType> = {
  mutter: RelationshipType.MOTHER,
  mother: RelationshipType.MOTHER,
  mama: RelationshipType.MOTHER,
  vater: RelationshipType.FATHER,
  father: RelationshipType.FATHER,
  papa: RelationshipType.FATHER,
  stiefmutter: RelationshipType.STEP_MOTHER,
  'step mother': RelationshipType.STEP_MOTHER,
  stepmother: RelationshipType.STEP_MOTHER,
  stiefvater: RelationshipType.STEP_FATHER,
  'step father': RelationshipType.STEP_FATHER,
  stepfather: RelationshipType.STEP_FATHER,
  grossmutter: RelationshipType.GRANDMOTHER,
  oma: RelationshipType.GRANDMOTHER,
  grandmother: RelationshipType.GRANDMOTHER,
  grossvater: RelationshipType.GRANDFATHER,
  opa: RelationshipType.GRANDFATHER,
  grandfather: RelationshipType.GRANDFATHER,
  vormund: RelationshipType.LEGAL_GUARDIAN,
  beistand: RelationshipType.LEGAL_GUARDIAN,
  'gesetzlicher vertreter': RelationshipType.LEGAL_GUARDIAN,
  'legal guardian': RelationshipType.LEGAL_GUARDIAN,
  guardian: RelationshipType.LEGAL_GUARDIAN,
  tante: RelationshipType.AUNT_UNCLE,
  onkel: RelationshipType.AUNT_UNCLE,
  aunt: RelationshipType.AUNT_UNCLE,
  uncle: RelationshipType.AUNT_UNCLE,
  geschwister: RelationshipType.SIBLING,
  bruder: RelationshipType.SIBLING,
  schwester: RelationshipType.SIBLING,
  sibling: RelationshipType.SIBLING,
  nanny: RelationshipType.NANNY,
  kindermaedchen: RelationshipType.NANNY,
  tagesmutter: RelationshipType.NANNY,
  andere: RelationshipType.OTHER,
  other: RelationshipType.OTHER,
  sonstige: RelationshipType.OTHER,
};

const GENDER_ALIASES: Record<string, Gender> = {
  m: Gender.MALE,
  male: Gender.MALE,
  maennlich: Gender.MALE,
  junge: Gender.MALE,
  knabe: Gender.MALE,
  boy: Gender.MALE,
  w: Gender.FEMALE,
  f: Gender.FEMALE,
  female: Gender.FEMALE,
  weiblich: Gender.FEMALE,
  maedchen: Gender.FEMALE,
  girl: Gender.FEMALE,
  d: Gender.OTHER,
  divers: Gender.OTHER,
  other: Gender.OTHER,
  andere: Gender.OTHER,
};

const SALUTATION_ALIASES: Record<string, Salutation> = {
  herr: Salutation.MR,
  hr: Salutation.MR,
  mr: Salutation.MR,
  frau: Salutation.MRS,
  fr: Salutation.MRS,
  mrs: Salutation.MRS,
  ms: Salutation.MRS,
  divers: Salutation.DIVERSE,
  diverse: Salutation.DIVERSE,
  keine: Salutation.NONE,
  none: Salutation.NONE,
};

const TRUE_VALUES = new Set([
  'ja',
  'j',
  'yes',
  'y',
  'true',
  'wahr',
  'x',
  '1',
  'oui',
  'si',
]);
const FALSE_VALUES = new Set([
  'nein',
  'n',
  'no',
  'false',
  'falsch',
  '0',
  'non',
]);

function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[;|,/]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/** Accepts YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY. Returns ISO or null. */
export const INVALID_DATE = Symbol('invalid-date');
export const INVALID_VALUE = Symbol('invalid-value');

export function parseDate(
  value: string | undefined | null,
): string | null | typeof INVALID_DATE {
  if (!value) return null;
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso)
    return isRealDate(+iso[1], +iso[2], +iso[3]) ? trimmed : INVALID_DATE;
  const dmy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/.exec(trimmed);
  if (dmy) {
    const day = +dmy[1];
    const month = +dmy[2];
    let year = +dmy[3];
    if (year < 100) year += year < 30 ? 2000 : 1900;
    if (!isRealDate(year, month, day)) return INVALID_DATE;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return INVALID_DATE;
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

function parseBoolean(
  value: string | undefined,
): boolean | null | typeof INVALID_VALUE {
  if (!value) return null;
  const norm = fold(value);
  if (TRUE_VALUES.has(norm)) return true;
  if (FALSE_VALUES.has(norm)) return false;
  return INVALID_VALUE;
}

function normalizeEmail(value: string | undefined | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Digits only, so "+41 79 123 45 67" and "079 123 45 67" compare equal. */
function phoneKey(value: string | undefined | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) return null;
  return digits.slice(-9);
}

let tempIdSeq = 0;
function nextTempId(prefix: string): string {
  tempIdSeq += 1;
  return `${prefix}_${tempIdSeq}`;
}

interface WorkingContact extends PlanContact {
  addressKey: string | null;
  /** Per-row link flags, applied to each student of the family. */
  linkByRow: Map<number, Omit<PlanLink, 'contactTempId'>>;
}

export function buildStudentImportPlan(
  parsed: StudentImportParseResult,
  existing: ExistingData,
): StudentImportPlan {
  tempIdSeq = 0;
  const issues: BuilderIssue[] = [];

  for (const column of parsed.unknownColumns) {
    issues.push({
      severity: StudentImportIssueSeverity.WARNING,
      code: StudentImportIssueCode.UNKNOWN_COLUMN,
      value: column,
    });
  }

  const classByName = new Map(
    existing.schoolClasses.map((c) => [fold(c.name), c.id]),
  );
  const gradeByName = new Map(
    existing.gradeLevels.map((g) => [fold(g.name), g.id]),
  );
  const countryByName = new Map<string, string>();
  for (const c of existing.countries) {
    if (c.name) countryByName.set(fold(c.name), c.id);
    if (c.isoCode) countryByName.set(fold(c.isoCode), c.id);
  }

  const existingStudentByExternalId = new Map(
    existing.students
      .filter((s) => s.externalStudentId)
      .map((s) => [fold(s.externalStudentId!), s.id]),
  );
  const existingStudentByNameDob = new Map(
    existing.students
      .filter((s) => s.dateOfBirth)
      .map((s) => [
        `${fold(s.firstName)}|${fold(s.lastName)}|${s.dateOfBirth}`,
        s.id,
      ]),
  );
  const existingContactByEmail = new Map<
    string,
    { id: string; familyId?: string | null }
  >();
  const existingContactByPhone = new Map<
    string,
    { id: string; familyId?: string | null }
  >();
  for (const c of existing.contacts) {
    const email = normalizeEmail(c.email);
    if (email && !existingContactByEmail.has(email)) {
      existingContactByEmail.set(email, { id: c.id, familyId: c.familyId });
    }
    for (const key of [phoneKey(c.mobile), phoneKey(c.phone)]) {
      if (key && !existingContactByPhone.has(key)) {
        existingContactByPhone.set(key, { id: c.id, familyId: c.familyId });
      }
    }
  }

  // Pass 1 — normalise contacts per row and merge identical people.
  const contactsByIdentity = new Map<string, WorkingContact>();
  const contactsPerRow = new Map<number, WorkingContact[]>();
  // Fallback bucket for name-only contacts, to flag possible duplicates.
  const nameOnlyContacts = new Map<string, WorkingContact[]>();

  for (const row of parsed.rows) {
    const addressKey = addressIdentity(row);
    const rowContacts: WorkingContact[] = [];
    for (const raw of row.contacts) {
      const built = buildContact(raw.block, raw.values, row, issues);
      if (!built) continue;

      const identity = contactIdentity(built.contact, addressKey);
      let working = identity ? contactsByIdentity.get(identity) : undefined;

      if (!working) {
        working = {
          ...built.contact,
          tempId: nextTempId('c'),
          familyKey: '',
          addressKey,
          sourceRowNumbers: [row.rowNumber],
          linkByRow: new Map(),
        };
        if (identity) contactsByIdentity.set(identity, working);
        if (
          !built.contact.email &&
          !phoneKey(built.contact.mobile) &&
          !phoneKey(built.contact.phone)
        ) {
          const nameKey = `${fold(built.contact.firstName)}|${fold(built.contact.lastName)}`;
          const bucket = nameOnlyContacts.get(nameKey) ?? [];
          bucket.push(working);
          nameOnlyContacts.set(nameKey, bucket);
        }
      } else {
        working.sourceRowNumbers.push(row.rowNumber);
        mergeContactFields(working, built.contact, row.rowNumber, issues);
      }
      if (!working.roles.includes(built.link.relationshipType)) {
        working.roles.push(built.link.relationshipType);
      }
      working.linkByRow.set(row.rowNumber, built.link);
      rowContacts.push(working);
    }
    contactsPerRow.set(row.rowNumber, rowContacts);
  }

  for (const [, bucket] of nameOnlyContacts) {
    if (bucket.length > 1) {
      issues.push({
        severity: StudentImportIssueSeverity.WARNING,
        code: StudentImportIssueCode.POSSIBLE_DUPLICATE_CONTACT,
        value: `${bucket[0].firstName} ${bucket[0].lastName}`,
        relatedRowNumbers: bucket.flatMap((c) => c.sourceRowNumbers),
      });
    }
  }

  // Pass 2 — families: rows sharing a contact belong to the same family.
  const familyKeyByRow = new Map<number, string>();
  const familyOfContact = new Map<string, string>();
  const families = new Map<string, PlanFamily & { rowNumbers: number[] }>();

  for (const row of parsed.rows) {
    const rowContacts = contactsPerRow.get(row.rowNumber) ?? [];
    const existingKey = rowContacts
      .map((c) => familyOfContact.get(c.tempId))
      .find((k): k is string => !!k);
    const key = existingKey ?? nextTempId('fam');
    familyKeyByRow.set(row.rowNumber, key);
    for (const c of rowContacts) {
      familyOfContact.set(c.tempId, key);
      c.familyKey = key;
    }

    const address = buildAddress(row, countryByName, issues);
    const family = families.get(key);
    if (family) {
      family.rowNumbers.push(row.rowNumber);
      if (address && family.address && addressIdentity(row) !== null) {
        const same =
          fold(family.address.street ?? '') === fold(address.street ?? '') &&
          fold(family.address.postalCode ?? '') ===
            fold(address.postalCode ?? '');
        if (!same) {
          issues.push({
            severity: StudentImportIssueSeverity.WARNING,
            code: StudentImportIssueCode.FAMILY_ADDRESS_CONFLICT,
            rowNumber: row.rowNumber,
            relatedRowNumbers: family.rowNumbers,
          });
        }
      }
      family.address ??= address;
    } else {
      families.set(key, {
        key,
        name: familyName(row, rowContacts),
        address,
        rowNumbers: [row.rowNumber],
      });
    }
  }

  // Pass 3 — students, DB matching, links.
  const students: PlanStudent[] = [];
  const seenStudentKeys = new Map<string, number>();

  for (const row of parsed.rows) {
    const firstName = row.student.firstName?.trim();
    const lastName = row.student.lastName?.trim();
    if (!firstName) {
      issues.push({
        severity: StudentImportIssueSeverity.ERROR,
        code: StudentImportIssueCode.MISSING_FIRST_NAME,
        rowNumber: row.rowNumber,
      });
    }
    if (!lastName) {
      issues.push({
        severity: StudentImportIssueSeverity.ERROR,
        code: StudentImportIssueCode.MISSING_LAST_NAME,
        rowNumber: row.rowNumber,
      });
    }
    if (!firstName || !lastName) continue;

    const dateOfBirth = readDate(
      row.student.dateOfBirth,
      row.rowNumber,
      'dateOfBirth',
      issues,
    );
    const enrollmentDate = readDate(
      row.student.enrollmentDate,
      row.rowNumber,
      'enrollmentDate',
      issues,
    );

    let gender: Gender | null = null;
    if (row.student.gender) {
      const norm = fold(row.student.gender);
      const upper = row.student.gender.toUpperCase();
      gender =
        GENDER_ALIASES[norm] ??
        ((Object.values(Gender) as string[]).includes(upper)
          ? (upper as Gender)
          : null);
      if (!gender) {
        issues.push({
          severity: StudentImportIssueSeverity.WARNING,
          code: StudentImportIssueCode.INVALID_GENDER,
          rowNumber: row.rowNumber,
          column: 'gender',
          value: row.student.gender,
        });
      }
    }

    const dupKey = `${fold(firstName)}|${fold(lastName)}|${dateOfBirth ?? ''}`;
    const firstSeen = seenStudentKeys.get(dupKey);
    if (firstSeen !== undefined) {
      issues.push({
        severity: StudentImportIssueSeverity.WARNING,
        code: StudentImportIssueCode.DUPLICATE_STUDENT_IN_FILE,
        rowNumber: row.rowNumber,
        value: `${firstName} ${lastName}`,
        relatedRowNumbers: [firstSeen],
      });
    } else {
      seenStudentKeys.set(dupKey, row.rowNumber);
    }

    const externalStudentId = row.student.externalStudentId ?? null;
    const existingStudentId =
      (externalStudentId
        ? existingStudentByExternalId.get(fold(externalStudentId))
        : undefined) ??
      (dateOfBirth
        ? existingStudentByNameDob.get(
            `${fold(firstName)}|${fold(lastName)}|${dateOfBirth}`,
          )
        : undefined) ??
      null;

    let schoolClassId: string | null = null;
    if (row.student.schoolClass) {
      schoolClassId = classByName.get(fold(row.student.schoolClass)) ?? null;
      if (!schoolClassId) {
        issues.push({
          severity: StudentImportIssueSeverity.WARNING,
          code: StudentImportIssueCode.UNKNOWN_SCHOOL_CLASS,
          rowNumber: row.rowNumber,
          column: 'schoolClass',
          value: row.student.schoolClass,
        });
      }
    }
    let gradeLevelId: string | null = null;
    if (row.student.gradeLevel) {
      gradeLevelId = gradeByName.get(fold(row.student.gradeLevel)) ?? null;
      if (!gradeLevelId) {
        issues.push({
          severity: StudentImportIssueSeverity.WARNING,
          code: StudentImportIssueCode.UNKNOWN_GRADE_LEVEL,
          rowNumber: row.rowNumber,
          column: 'gradeLevel',
          value: row.student.gradeLevel,
        });
      }
    }

    const rowContacts = contactsPerRow.get(row.rowNumber) ?? [];
    const links: PlanLink[] = rowContacts.map((c) => {
      const link = c.linkByRow.get(row.rowNumber)!;
      return { ...link, contactTempId: c.tempId };
    });
    // At most one primary contact per student.
    let primarySeen = false;
    for (const link of links) {
      if (link.isPrimaryContact && primarySeen) link.isPrimaryContact = false;
      else if (link.isPrimaryContact) primarySeen = true;
    }
    if (!primarySeen && links.length > 0) links[0].isPrimaryContact = true;

    students.push({
      tempId: nextTempId('s'),
      sourceRowNumber: row.rowNumber,
      familyKey: familyKeyByRow.get(row.rowNumber)!,
      existingStudentId,
      firstName,
      lastName,
      preferredName: row.student.preferredName ?? null,
      dateOfBirth,
      gender,
      placeOfBirth: row.student.placeOfBirth ?? null,
      nationalities: splitList(row.student.nationalities),
      firstLanguages: splitList(row.student.firstLanguages),
      familyLanguages: splitList(row.student.familyLanguages),
      religion: row.student.religion ?? null,
      socialSecurityNumber: row.student.socialSecurityNumber ?? null,
      externalStudentId,
      enrollmentDate,
      notes: row.student.notes ?? null,
      schoolClassId,
      schoolClassName: row.student.schoolClass ?? null,
      gradeLevelId,
      gradeLevelName: row.student.gradeLevel ?? null,
      links,
    });
  }

  // Pass 4 — match contacts against existing DB records, reuse their family.
  const contacts: PlanContact[] = [];
  let mergedContactCount = 0;
  for (const working of new Set(
    [...contactsPerRow.values()].flatMap((list) => list),
  )) {
    const email = normalizeEmail(working.email);
    const match =
      (email ? existingContactByEmail.get(email) : undefined) ??
      existingContactByPhone.get(phoneKey(working.mobile) ?? '\0') ??
      existingContactByPhone.get(phoneKey(working.phone) ?? '\0');
    working.existingContactPersonId = match?.id ?? null;
    if (match?.familyId) {
      const family = families.get(working.familyKey);
      if (family) family.existingFamilyId ??= match.familyId;
    }
    if (working.sourceRowNumbers.length > 1) mergedContactCount += 1;
    const { addressKey: _a, linkByRow: _l, ...plain } = working;
    contacts.push(plain);
  }

  const errorCount = issues.filter(
    (i) => i.severity === StudentImportIssueSeverity.ERROR,
  ).length;
  const warningCount = issues.length - errorCount;

  return {
    students,
    contacts,
    families: [...families.values()].map(({ rowNumbers: _r, ...f }) => f),
    issues,
    stats: {
      rowCount: parsed.rows.length,
      newStudentCount: students.filter((s) => !s.existingStudentId).length,
      existingStudentCount: students.filter((s) => s.existingStudentId).length,
      newContactCount: contacts.filter((c) => !c.existingContactPersonId)
        .length,
      existingContactCount: contacts.filter((c) => c.existingContactPersonId)
        .length,
      mergedContactCount,
      familyCount: families.size,
      errorCount,
      warningCount,
    },
  };
}

function readDate(
  value: string | undefined | null,
  rowNumber: number,
  column: string,
  issues: BuilderIssue[],
): string | null {
  const parsed = parseDate(value);
  if (parsed === INVALID_DATE) {
    issues.push({
      severity: StudentImportIssueSeverity.WARNING,
      code: StudentImportIssueCode.INVALID_DATE,
      rowNumber,
      column,
      value: value ?? null,
    });
    return null;
  }
  return parsed;
}

function buildContact(
  block: ContactBlock,
  values: RawContactValues,
  row: StudentImportRawRow,
  issues: BuilderIssue[],
): { contact: PlanContact; link: PlanLink } | null {
  const firstName = values.firstName?.trim();
  const lastName = values.lastName?.trim();
  const hasAnyValue = Object.values(values).some(
    (v) => v !== undefined && v !== '',
  );
  if (!hasAnyValue) return null;
  if (!firstName || !lastName) {
    issues.push({
      severity: StudentImportIssueSeverity.WARNING,
      code: StudentImportIssueCode.CONTACT_MISSING_NAME,
      rowNumber: row.rowNumber,
      column: block,
    });
    return null;
  }

  let relationship = BLOCK_DEFAULT_RELATIONSHIP[block];
  if (values.relationship) {
    const norm = fold(values.relationship);
    const mapped =
      RELATIONSHIP_ALIASES[norm] ??
      ((Object.values(RelationshipType) as string[]).includes(
        values.relationship.toUpperCase(),
      )
        ? (values.relationship.toUpperCase() as RelationshipType)
        : null);
    if (mapped) {
      relationship = mapped;
    } else {
      issues.push({
        severity: StudentImportIssueSeverity.WARNING,
        code: StudentImportIssueCode.INVALID_RELATIONSHIP,
        rowNumber: row.rowNumber,
        column: block,
        value: values.relationship,
      });
    }
  }
  if (!relationship) {
    issues.push({
      severity: StudentImportIssueSeverity.WARNING,
      code: StudentImportIssueCode.CONTACT_MISSING_RELATIONSHIP,
      rowNumber: row.rowNumber,
      column: block,
    });
    relationship = RelationshipType.OTHER;
  }

  let salutation: Salutation | null = null;
  if (values.salutation) {
    const norm = fold(values.salutation);
    salutation =
      SALUTATION_ALIASES[norm] ??
      ((Object.values(Salutation) as string[]).includes(
        values.salutation.toUpperCase(),
      )
        ? (values.salutation.toUpperCase() as Salutation)
        : null);
    if (!salutation) {
      issues.push({
        severity: StudentImportIssueSeverity.WARNING,
        code: StudentImportIssueCode.INVALID_SALUTATION,
        rowNumber: row.rowNumber,
        column: block,
        value: values.salutation,
      });
    }
  }

  const email = normalizeEmail(values.email);
  if (email && !EMAIL_RE.test(email)) {
    issues.push({
      severity: StudentImportIssueSeverity.WARNING,
      code: StudentImportIssueCode.INVALID_EMAIL,
      rowNumber: row.rowNumber,
      column: block,
      value: values.email ?? null,
    });
  }

  const readFlag = (raw: string | undefined, fallback: boolean): boolean => {
    const parsed = parseBoolean(raw);
    if (parsed === INVALID_VALUE) {
      issues.push({
        severity: StudentImportIssueSeverity.WARNING,
        code: StudentImportIssueCode.INVALID_BOOLEAN,
        rowNumber: row.rowNumber,
        column: block,
        value: raw ?? null,
      });
      return fallback;
    }
    return parsed ?? fallback;
  };

  let emergencyPriority: number | null = null;
  if (values.emergencyPriority) {
    const n = Number(values.emergencyPriority.replace(',', '.'));
    if (Number.isInteger(n) && n > 0) {
      emergencyPriority = n;
    } else {
      issues.push({
        severity: StudentImportIssueSeverity.WARNING,
        code: StudentImportIssueCode.INVALID_NUMBER,
        rowNumber: row.rowNumber,
        column: block,
        value: values.emergencyPriority,
      });
    }
  }

  const isParent =
    relationship === RelationshipType.MOTHER ||
    relationship === RelationshipType.FATHER ||
    relationship === RelationshipType.LEGAL_GUARDIAN;

  return {
    contact: {
      tempId: '',
      familyKey: '',
      firstName,
      lastName,
      salutation,
      title: values.title ?? null,
      email: email && EMAIL_RE.test(email) ? email : null,
      phone: values.phone ?? null,
      mobile: values.mobile ?? null,
      occupation: values.occupation ?? null,
      preferredLanguages: splitList(values.preferredLanguages),
      roles: [],
      sourceRowNumbers: [],
    },
    link: {
      contactTempId: '',
      relationshipType: relationship,
      isPrimaryContact: readFlag(values.isPrimaryContact, false),
      hasCustody: readFlag(values.hasCustody, isParent),
      isPickupAuthorized: readFlag(values.isPickupAuthorized, true),
      emergencyPriority,
      livesWithStudent: readFlag(values.livesWithStudent, isParent),
    },
  };
}

/**
 * Identity of a person across rows: e-mail wins, then phone digits, then
 * name plus address. Name alone never merges — two "Anna Müller" without
 * contact data stay separate and get a duplicate warning instead.
 */
function contactIdentity(
  contact: PlanContact,
  addressKey: string | null,
): string | null {
  const email = normalizeEmail(contact.email);
  if (email) return `e:${email}`;
  const phone = phoneKey(contact.mobile) ?? phoneKey(contact.phone);
  if (phone) return `p:${phone}`;
  if (addressKey) {
    return `n:${fold(contact.firstName)}|${fold(contact.lastName)}|${addressKey}`;
  }
  return null;
}

function addressIdentity(row: StudentImportRawRow): string | null {
  const street = row.address.street?.trim();
  const postalCode = row.address.postalCode?.trim();
  if (!street && !postalCode) return null;
  return `${fold(street ?? '')}|${row.address.houseNumber?.trim() ?? ''}|${fold(postalCode ?? '')}`;
}

function buildAddress(
  row: StudentImportRawRow,
  countryByName: Map<string, string>,
  issues: BuilderIssue[],
): PlanAddress | null {
  const { street, houseNumber, postalCode, city, country } = row.address;
  if (!street && !houseNumber && !postalCode && !city && !country) return null;
  let countryId: string | null = null;
  if (country) {
    countryId = countryByName.get(fold(country)) ?? null;
    if (!countryId) {
      issues.push({
        severity: StudentImportIssueSeverity.WARNING,
        code: StudentImportIssueCode.UNKNOWN_COUNTRY,
        rowNumber: row.rowNumber,
        column: 'country',
        value: country,
      });
    }
  }
  return {
    street: street ?? null,
    houseNumber: houseNumber ?? null,
    postalCode: postalCode ?? null,
    city: city ?? null,
    countryId,
    countryName: country ?? null,
  };
}

/** Merge later occurrences of the same person; conflicting values warn. */
function mergeContactFields(
  target: WorkingContact,
  incoming: PlanContact,
  rowNumber: number,
  issues: BuilderIssue[],
): void {
  const fields: (keyof PlanContact)[] = [
    'salutation',
    'title',
    'email',
    'phone',
    'mobile',
    'occupation',
  ];
  for (const field of fields) {
    const next = incoming[field] as string | null;
    if (!next) continue;
    const current = target[field] as string | null;
    if (!current) {
      (target as unknown as Record<string, unknown>)[field] = next;
    } else if (fold(String(current)) !== fold(String(next))) {
      issues.push({
        severity: StudentImportIssueSeverity.WARNING,
        code: StudentImportIssueCode.CONTACT_DATA_CONFLICT,
        rowNumber,
        column: field,
        value: `${current} ≠ ${next}`,
        relatedRowNumbers: target.sourceRowNumbers.filter(
          (r) => r !== rowNumber,
        ),
      });
    }
  }
  for (const lang of incoming.preferredLanguages) {
    if (!target.preferredLanguages.includes(lang)) {
      target.preferredLanguages.push(lang);
    }
  }
}

function familyName(
  row: StudentImportRawRow,
  contacts: WorkingContact[],
): string {
  const parent = contacts[0];
  const last = parent?.lastName ?? row.student.lastName ?? 'Familie';
  return `Familie ${last}`;
}
