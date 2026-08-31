/**
 * Idempotent, self-sufficient seed script for the local "Testschule" dev
 * environment. Safe to run against a completely empty database.
 *
 * Run with:
 *   cd apps/backend
 *   npx ts-node -T scripts/seed-testschule.ts
 *
 * What it does, in order:
 *   1. Boots a NestJS application context (no HTTP listener) so it can call
 *      real backend services for anything with non-trivial business logic —
 *      org creation (`OrganizationsService.create`, which transitively seeds
 *      system roles/permissions/absence categories/admission stages/feature
 *      toggles) and the admission→enrollment flow
 *      (`AdmissionApplicationsService.create` + `.finalizeEnrollment`, which
 *      creates the Student row, mirrors family contacts onto the student, and
 *      creates the SchoolClassEnrollment row).
 *   2. Finds-or-creates an org named "Testschule" — the org id is discovered
 *      at runtime, never hardcoded.
 *   3. Everything else (test users, admission stages/applications, contact
 *      persons, lesson records, Hattie/Montessori observation axes, employee
 *      contracts, vacations, absences, teams, time tracking, projects, chats)
 *      is seeded via a raw `pg` Client, following this file's own established
 *      idempotency conventions (existence-check-then-insert / ON CONFLICT).
 *
 * Safe to re-run — every section uses ON CONFLICT or check-then-insert.
 */
import 'reflect-metadata';
import 'dotenv/config';
// AppModule and everything it transitively imports uses the `@/*` → `src/*`
// path alias (see tsconfig.json). ts-node doesn't resolve TS path mappings on
// its own — tsconfig-paths/register patches Node's module resolution to
// honor them, same as this repo's other ts-node entry points (see the
// `typeorm`/`test:debug` package.json scripts).
import 'tsconfig-paths/register';
import { Client } from 'pg';
import { createHash, randomUUID, randomBytes } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';

// Deterministic per-lesson pseudo-random in [0, 1). Seed reruns stay stable
// while each lesson lands on a different point in the range.
function lessonRand(lessonId: string, salt: string): number {
  const h = createHash('sha256').update(`${lessonId}::${salt}`).digest();
  return h.readUInt32BE(0) / 0x100000000;
}

function pickInRange(
  lessonId: string,
  salt: string,
  min: number,
  max: number,
): number {
  return Math.round(min + lessonRand(lessonId, salt) * (max - min));
}
/**
 * better-auth hashes passwords with scrypt from `@better-auth/utils`. The
 * package is ESM-only and exposes `password` as an `exports` subpath, which
 * this project's `moduleResolution: node` cannot resolve statically — so it is
 * loaded dynamically, the same way migrate-auth.ts loads
 * `better-auth/db/migration`.
 *
 * The dependency is pinned to the exact version better-auth itself depends on:
 * a different scrypt implementation would produce hashes that no longer verify
 * at login.
 */
async function hashPassword(password: string): Promise<string> {
  // `new Function` keeps the import() out of TypeScript's reach: with
  // `module: commonjs` tsc rewrites a plain `await import()` into `require()`,
  // which throws ERR_REQUIRE_ESM on this ESM-only package.
  const dynamicImport = new Function(
    'specifier',
    'return import(specifier)',
  ) as (specifier: string) => Promise<{
    hashPassword: (pw: string) => Promise<string>;
  }>;
  const { hashPassword: hash } = await dynamicImport(
    '@better-auth/utils/password',
  );
  return hash(password);
}
import {
  ensureStaffUser,
  seedCurriculaFromXlsx,
  seedLargeSchool,
} from './seed-testschule-large';

const ORG_NAME = 'Testschule';
const ORG_SUBDOMAIN = 'testschule';
/**
 * Password for every seeded user.
 *
 * Locally this stays `test1234` so the dev flow is unchanged. On a publicly
 * reachable environment (staging) the seed MUST NOT hand out a password that
 * anyone can read in this repository — `reset-staging.ts` therefore requires
 * SEED_USER_PASSWORD to be set and passes it through the environment.
 */
const PW_PLAIN = process.env.SEED_USER_PASSWORD ?? 'test1234';

const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433),
  user: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'restart',
};

// AppModule's TypeOrmModule/GraphQLModule use `configService.getOrThrow(...)`
// for these — fill in the same fallbacks as DB above (and a couple of other
// required-at-boot vars) BEFORE importing AppModule, so `createApplicationContext`
// works out of the box in a bare dev shell with no `.env` file.
process.env.DB_HOST ??= DB.host;
process.env.DB_PORT ??= String(DB.port);
process.env.DB_USERNAME ??= DB.user;
process.env.DB_PASSWORD ??= DB.password;
process.env.DB_NAME ??= DB.database;
process.env.PORT ??= '4001';
process.env.NODE_ENV ??= 'development';
// better-auth (src/lib/auth.ts) requires these at import time even though
// this script never exercises a real login/OAuth flow (it writes better-auth
// rows directly via `pg`, same as the rest of this file always has). Dummy
// dev-only values — never used to sign or verify anything real.
process.env.BETTER_AUTH_SECRET ??=
  'dev-only-seed-script-secret-not-for-production';
process.env.BETTER_AUTH_URL ??= 'http://localhost:4001';
process.env.GOOGLE_AUTH_CLIENT_ID ??= 'dev-only-seed-script-placeholder';
process.env.GOOGLE_AUTH_CLIENT_SECRET ??= 'dev-only-seed-script-placeholder';
process.env.GOOGLE_MAIL_REFRESH_TOKEN ??= 'dev-only-seed-script-placeholder';
process.env.SMTP_USER ??= 'dev-only-seed-script@example.invalid';
process.env.ALLOWED_ORIGINS ??= 'http://localhost:4000';
// Must be a real 64-hex-char (32-byte) key — EncryptionService validates the
// format at construction time. Dev-only fixed value (not a secret in the
// sense of protecting anything real; this script never encrypts data anyone
// relies on) so re-runs stay deterministic.
process.env.ORG_SETTINGS_ENCRYPTION_KEY ??=
  '1655e2e5be862029c914f072a87ae319264b6571f3fe63b676c94d1366b6d893'.slice(
    0,
    64,
  );

const baId = (len = 32) => randomBytes(len).toString('base64url').slice(0, len);

interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  persona:
    'ADMIN' | 'HR' | 'OFFICE' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'EMPLOYEE';
  roleCode:
    | 'ORG_OWNER'
    | 'ORG_ADMIN'
    | 'HR_MANAGER'
    | 'OFFICE'
    | 'TEAM_LEAD'
    | 'EMPLOYEE';
  isTeacher: boolean;
}

const USERS: TestUser[] = [
  {
    email: 'admin@testschule.ch',
    firstName: 'Anna',
    lastName: 'Admin',
    persona: 'ADMIN',
    roleCode: 'ORG_ADMIN',
    isTeacher: false,
  },
  {
    email: 'hr@testschule.ch',
    firstName: 'Heidi',
    lastName: 'Hofstetter',
    persona: 'HR',
    roleCode: 'HR_MANAGER',
    isTeacher: false,
  },
  {
    email: 'sekretariat@testschule.ch',
    firstName: 'Silvia',
    lastName: 'Sutter',
    persona: 'OFFICE',
    roleCode: 'OFFICE',
    isTeacher: false,
  },
  {
    email: 'sandra.lehrerin@testschule.ch',
    firstName: 'Sandra',
    lastName: 'Müller',
    persona: 'TEACHER',
    roleCode: 'EMPLOYEE',
    isTeacher: true,
  },
  {
    email: 'thomas.lehrer@testschule.ch',
    firstName: 'Thomas',
    lastName: 'Brunner',
    persona: 'TEACHER',
    roleCode: 'EMPLOYEE',
    isTeacher: true,
  },
  {
    email: 'mira.assistentin@testschule.ch',
    firstName: 'Mira',
    lastName: 'Aebi',
    persona: 'TEACHER',
    roleCode: 'EMPLOYEE',
    isTeacher: true,
  },
  {
    email: 'daniel.lehrer@testschule.ch',
    firstName: 'Daniel',
    lastName: 'Schmid',
    persona: 'TEACHER',
    roleCode: 'EMPLOYEE',
    isTeacher: true,
  },
  {
    email: 'petra.lehrerin@testschule.ch',
    firstName: 'Petra',
    lastName: 'Steiner',
    persona: 'TEACHER',
    roleCode: 'EMPLOYEE',
    isTeacher: true,
  },
  {
    email: 'lukas.hauswart@testschule.ch',
    firstName: 'Lukas',
    lastName: 'Bürgi',
    persona: 'EMPLOYEE',
    roleCode: 'EMPLOYEE',
    isTeacher: false,
  },
];

const STAGES = [
  {
    name: 'Anfrage',
    slug: 'anfrage',
    color: '#94a3b8',
    position: 0,
    stage_type: 'INITIAL',
    is_default: true,
  },
  {
    name: 'Hospitation',
    slug: 'hospitation',
    color: '#0ea5e9',
    position: 1,
    stage_type: 'IN_PROGRESS',
    is_default: false,
  },
  {
    name: 'Aufnahmegespräch',
    slug: 'aufnahmegespraech',
    color: '#f59e0b',
    position: 2,
    stage_type: 'IN_PROGRESS',
    is_default: false,
  },
  {
    name: 'Vertrag',
    slug: 'vertrag',
    color: '#a855f7',
    position: 3,
    stage_type: 'ACCEPTED',
    is_default: false,
  },
  {
    name: 'Aktiv',
    slug: 'aktiv',
    color: '#22c55e',
    position: 4,
    stage_type: 'ENROLLED',
    is_default: false,
  },
  {
    name: 'Abgelehnt',
    slug: 'abgelehnt',
    color: '#ef4444',
    position: 5,
    stage_type: 'REJECTED',
    is_default: false,
  },
];

const NEW_GRADE_LEVELS = [
  { name: 'Vorschule', sortOrder: 0, color: '#FBBF24' },
  { name: 'Primarstufe', sortOrder: 10, color: '#6366F1' },
  { name: 'Oberstufe', sortOrder: 30, color: '#8B5CF6' },
];

// Colour palette used to backfill grade-levels that already exist (e.g. the
// `Kindergarten`/`Unterstufe`/`Mittelstufe` rows the seed inherits from a
// pre-existing org). Idempotent — only fills rows where colour is still NULL.
const GRADE_LEVEL_COLOR_DEFAULTS: Record<string, string> = {
  Vorschule: '#FBBF24',
  Kindergarten: '#F97316',
  Unterstufe: '#06B6D4',
  Mittelstufe: '#3B82F6',
  Primarstufe: '#6366F1',
  Oberstufe: '#8B5CF6',
};

// "Klasse PA" ("Primarstufe A") is the class Levin Baumann and his classmates
// (see KLASSE_PA_STUDENTS below) get enrolled into — section 9's Hattie/
// Montessori observation-axis generation looks students up by this exact
// class name, so keep it in sync if you rename it here.
const PA_CLASS_NAME = 'Klasse PA';

const NEW_CLASSES: Array<{
  name: string;
  color: string;
  room: string;
  maxCapacity: number;
  gradeLevel: string;
}> = [
  {
    name: 'Kinderhaus 1',
    color: '#FBBF24',
    room: 'Raum 101',
    maxCapacity: 20,
    gradeLevel: 'Vorschule',
  },
  {
    name: 'Kinderhaus 2',
    color: '#FBBF24',
    room: 'Raum 102',
    maxCapacity: 20,
    gradeLevel: 'Vorschule',
  },
  {
    name: PA_CLASS_NAME,
    color: '#6366F1',
    room: 'Raum 201',
    maxCapacity: 24,
    gradeLevel: 'Primarstufe',
  },
  {
    name: 'Klasse PB',
    color: '#6366F1',
    room: 'Raum 202',
    maxCapacity: 24,
    gradeLevel: 'Primarstufe',
  },
  {
    name: 'Klasse OA',
    color: '#8B5CF6',
    room: 'Raum 301',
    maxCapacity: 22,
    gradeLevel: 'Oberstufe',
  },
];

// Permissions to grant to each role (the seeder shipped without school-related
// perms). Idempotent INSERT, so safe to extend.
const ROLE_PERMS: Record<string, string[]> = {
  ORG_OWNER: [
    'SCHOOL_CLASS_READ',
    'SCHOOL_CLASS_WRITE',
    'SCHOOL_CLASS_DELETE',
    'CONTACT_PERSON_READ',
    'CONTACT_PERSON_WRITE',
    'CONTACT_PERSON_DELETE',
    'ADMISSION_STAGE_READ',
    'ADMISSION_STAGE_MANAGE',
    'ADMISSION_APPLICATION_READ',
    'ADMISSION_APPLICATION_WRITE',
    'ADMISSION_APPLICATION_MOVE',
    'ADMISSION_APPLICATION_ENROLL',
    'ADMISSION_APPLICATION_DELETE',
    'FAMILY_READ',
    'FAMILY_WRITE',
    'CURRICULUM_LEVEL_READ',
    'CURRICULUM_LEVEL_MANAGE',
    'CURRICULUM_READ',
    'CURRICULUM_MANAGE',
    'ADDRESS_READ',
    'ADDRESS_WRITE',
    'ADDRESS_DELETE',
  ],
  ORG_ADMIN: [
    'SCHOOL_CLASS_READ',
    'SCHOOL_CLASS_WRITE',
    'SCHOOL_CLASS_DELETE',
    'CONTACT_PERSON_READ',
    'CONTACT_PERSON_WRITE',
    'CONTACT_PERSON_DELETE',
    'ADMISSION_STAGE_READ',
    'ADMISSION_STAGE_MANAGE',
    'ADMISSION_APPLICATION_READ',
    'ADMISSION_APPLICATION_WRITE',
    'ADMISSION_APPLICATION_MOVE',
    'ADMISSION_APPLICATION_ENROLL',
    'ADMISSION_APPLICATION_DELETE',
    'FAMILY_READ',
    'FAMILY_WRITE',
    'CURRICULUM_LEVEL_READ',
    'CURRICULUM_LEVEL_MANAGE',
    'CURRICULUM_READ',
    'CURRICULUM_MANAGE',
    'ADDRESS_READ',
    'ADDRESS_WRITE',
    'ADDRESS_DELETE',
  ],
  OFFICE: [
    'SCHOOL_CLASS_READ',
    'CONTACT_PERSON_READ',
    'CONTACT_PERSON_WRITE',
    'CONTACT_PERSON_DELETE',
    'ADMISSION_STAGE_READ',
    'ADMISSION_STAGE_MANAGE',
    'ADMISSION_APPLICATION_READ',
    'ADMISSION_APPLICATION_WRITE',
    'ADMISSION_APPLICATION_MOVE',
    'ADMISSION_APPLICATION_ENROLL',
    'ADMISSION_APPLICATION_DELETE',
    'FAMILY_READ',
    'FAMILY_WRITE',
    'CURRICULUM_READ',
    'ADDRESS_READ',
    'ADDRESS_WRITE',
  ],
  HR_MANAGER: ['SCHOOL_CLASS_READ', 'ADDRESS_READ'],
  EMPLOYEE: [
    'SCHOOL_CLASS_READ',
    'CONTACT_PERSON_READ',
    'CURRICULUM_READ',
    'CURRICULUM_LEVEL_READ',
  ],
  TEAM_LEAD: ['SCHOOL_CLASS_READ', 'CONTACT_PERSON_READ'],
};

// -------------------------------------------------------------------------
// Admission pipeline test data: families with parents + applications across
// every stage so the Aufnahmeprozess Kanban has realistic content on first
// launch (~30 cards distributed over the configured stages, with some sibling
// constellations sharing a Family / contact persons).
// -------------------------------------------------------------------------

type ApplicantChild = {
  firstName: string;
  lastName: string;
  /** ISO date `YYYY-MM-DD`. */
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  /** Stage slug from the STAGES list. */
  stage:
    'anfrage' | 'hospitation' | 'aufnahmegespraech' | 'vertrag' | 'abgelehnt';
  source?: 'MANUAL' | 'PUBLIC_FORM' | 'OPEN_DAY' | 'REFERRAL' | 'OTHER';
  notes?: string;
  /** Days since the card entered the current stage — drives "X d in stage". */
  daysInStage?: number;
};

type ApplicantParent = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  salutation: 'MR' | 'MRS' | 'DIVERSE' | 'NONE';
  relationship:
    | 'MOTHER'
    | 'FATHER'
    | 'STEP_MOTHER'
    | 'STEP_FATHER'
    | 'GRANDMOTHER'
    | 'GRANDFATHER'
    | 'LEGAL_GUARDIAN'
    | 'NANNY'
    | 'AUNT_UNCLE';
  isPrimary?: boolean;
  occupation?: string;
};

type ApplicantFamily = {
  familyName: string;
  parents: ApplicantParent[];
  children: ApplicantChild[];
};

const APPLICANT_FAMILIES: ApplicantFamily[] = [
  // -- Single-child families --
  {
    familyName: 'Familie Frei',
    parents: [
      {
        firstName: 'Carmen',
        lastName: 'Frei',
        email: 'carmen.frei@example.ch',
        phone: '+41 79 300 11 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Pflegefachfrau',
      },
    ],
    children: [
      {
        firstName: 'Lina',
        lastName: 'Frei',
        dateOfBirth: '2019-04-12',
        gender: 'FEMALE',
        stage: 'anfrage',
        source: 'PUBLIC_FORM',
        daysInStage: 2,
      },
    ],
  },
  {
    familyName: 'Familie Wenger',
    parents: [
      {
        firstName: 'Stefanie',
        lastName: 'Wenger',
        email: 'stefanie.wenger@example.ch',
        phone: '+41 79 300 12 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Architektin',
      },
      {
        firstName: 'Beat',
        lastName: 'Wenger',
        email: 'beat.wenger@example.ch',
        phone: '+41 79 300 12 02',
        salutation: 'MR',
        relationship: 'FATHER',
        occupation: 'IT-Consultant',
      },
    ],
    children: [
      {
        firstName: 'Noah',
        lastName: 'Wenger',
        dateOfBirth: '2018-09-05',
        gender: 'MALE',
        stage: 'anfrage',
        source: 'OPEN_DAY',
        daysInStage: 5,
      },
    ],
  },
  {
    familyName: 'Familie Lüthi',
    parents: [
      {
        firstName: 'Daniela',
        lastName: 'Lüthi',
        email: 'daniela.luethi@example.ch',
        phone: '+41 79 300 13 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Lehrerin',
      },
    ],
    children: [
      {
        firstName: 'Mia',
        lastName: 'Lüthi',
        dateOfBirth: '2020-01-22',
        gender: 'FEMALE',
        stage: 'anfrage',
        source: 'REFERRAL',
        daysInStage: 11,
      },
    ],
  },
  {
    familyName: 'Familie Bär',
    parents: [
      {
        firstName: 'Patrick',
        lastName: 'Bär',
        email: 'patrick.baer@example.ch',
        phone: '+41 79 300 14 01',
        salutation: 'MR',
        relationship: 'FATHER',
        isPrimary: true,
        occupation: 'Treuhänder',
      },
      {
        firstName: 'Isabelle',
        lastName: 'Bär',
        email: 'isabelle.baer@example.ch',
        phone: '+41 79 300 14 02',
        salutation: 'MRS',
        relationship: 'MOTHER',
        occupation: 'Marketing-Managerin',
      },
    ],
    children: [
      {
        firstName: 'Liam',
        lastName: 'Bär',
        dateOfBirth: '2017-07-18',
        gender: 'MALE',
        stage: 'hospitation',
        source: 'MANUAL',
        daysInStage: 8,
      },
    ],
  },
  {
    familyName: 'Familie Ott',
    parents: [
      {
        firstName: 'Reto',
        lastName: 'Ott',
        email: 'reto.ott@example.ch',
        phone: '+41 79 300 15 01',
        salutation: 'MR',
        relationship: 'FATHER',
        isPrimary: true,
      },
    ],
    children: [
      {
        firstName: 'Sofia',
        lastName: 'Ott',
        dateOfBirth: '2019-11-30',
        gender: 'FEMALE',
        stage: 'hospitation',
        source: 'PUBLIC_FORM',
        daysInStage: 14,
      },
    ],
  },
  {
    familyName: 'Familie Marti',
    parents: [
      {
        firstName: 'Yvonne',
        lastName: 'Marti',
        email: 'yvonne.marti@example.ch',
        phone: '+41 79 300 16 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Sozialpädagogin',
      },
      {
        firstName: 'Tobias',
        lastName: 'Marti',
        email: 'tobias.marti@example.ch',
        phone: '+41 79 300 16 02',
        salutation: 'MR',
        relationship: 'FATHER',
      },
    ],
    children: [
      {
        firstName: 'Elias',
        lastName: 'Marti',
        dateOfBirth: '2018-03-09',
        gender: 'MALE',
        stage: 'aufnahmegespraech',
        source: 'MANUAL',
        daysInStage: 4,
      },
    ],
  },
  {
    familyName: 'Familie Roth',
    parents: [
      {
        firstName: 'Corinne',
        lastName: 'Roth',
        email: 'corinne.roth@example.ch',
        phone: '+41 79 300 17 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Hebamme',
      },
    ],
    children: [
      {
        firstName: 'Anouk',
        lastName: 'Roth',
        dateOfBirth: '2017-12-02',
        gender: 'FEMALE',
        stage: 'aufnahmegespraech',
        source: 'REFERRAL',
        daysInStage: 9,
      },
    ],
  },
  {
    familyName: 'Familie Imhof',
    parents: [
      {
        firstName: 'Michael',
        lastName: 'Imhof',
        email: 'michael.imhof@example.ch',
        phone: '+41 79 300 18 01',
        salutation: 'MR',
        relationship: 'FATHER',
        isPrimary: true,
        occupation: 'Ingenieur',
      },
      {
        firstName: 'Franziska',
        lastName: 'Imhof',
        email: 'franziska.imhof@example.ch',
        phone: '+41 79 300 18 02',
        salutation: 'MRS',
        relationship: 'MOTHER',
      },
    ],
    children: [
      {
        firstName: 'Theo',
        lastName: 'Imhof',
        dateOfBirth: '2016-08-21',
        gender: 'MALE',
        stage: 'vertrag',
        source: 'OPEN_DAY',
        daysInStage: 21,
      },
    ],
  },
  {
    familyName: 'Familie Walter',
    parents: [
      {
        firstName: 'Nicole',
        lastName: 'Walter',
        email: 'nicole.walter@example.ch',
        phone: '+41 79 300 19 01',
        salutation: 'MRS',
        relationship: 'LEGAL_GUARDIAN',
        isPrimary: true,
        occupation: 'Anwältin',
      },
    ],
    children: [
      {
        firstName: 'Lara',
        lastName: 'Walter',
        dateOfBirth: '2019-06-14',
        gender: 'FEMALE',
        stage: 'vertrag',
        source: 'MANUAL',
        daysInStage: 16,
      },
    ],
  },
  {
    familyName: 'Familie Tanner',
    parents: [
      {
        firstName: 'Tanja',
        lastName: 'Tanner',
        email: 'tanja.tanner@example.ch',
        phone: '+41 79 300 20 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
      },
    ],
    children: [
      {
        firstName: 'Linus',
        lastName: 'Tanner',
        dateOfBirth: '2020-02-28',
        gender: 'MALE',
        stage: 'anfrage',
        source: 'PUBLIC_FORM',
        daysInStage: 1,
      },
    ],
  },
  {
    familyName: 'Familie Hofmann',
    parents: [
      {
        firstName: 'Andreas',
        lastName: 'Hofmann',
        email: 'andreas.hofmann@example.ch',
        phone: '+41 79 300 21 01',
        salutation: 'MR',
        relationship: 'FATHER',
        isPrimary: true,
        occupation: 'Tischler',
      },
    ],
    children: [
      {
        firstName: 'Selma',
        lastName: 'Hofmann',
        dateOfBirth: '2018-05-17',
        gender: 'FEMALE',
        stage: 'anfrage',
        source: 'OPEN_DAY',
        daysInStage: 7,
      },
    ],
  },
  {
    familyName: 'Familie Vogel',
    parents: [
      {
        firstName: 'Manuela',
        lastName: 'Vogel',
        email: 'manuela.vogel@example.ch',
        phone: '+41 79 300 22 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
      },
      {
        firstName: 'Philipp',
        lastName: 'Vogel',
        email: 'philipp.vogel@example.ch',
        phone: '+41 79 300 22 02',
        salutation: 'MR',
        relationship: 'FATHER',
      },
    ],
    children: [
      {
        firstName: 'Ella',
        lastName: 'Vogel',
        dateOfBirth: '2019-10-09',
        gender: 'FEMALE',
        stage: 'hospitation',
        source: 'REFERRAL',
        daysInStage: 6,
        notes: 'Mit Hund kommt vor Hospitation klären.',
      },
    ],
  },
  {
    familyName: 'Familie Jenni',
    parents: [
      {
        firstName: 'Christian',
        lastName: 'Jenni',
        email: 'christian.jenni@example.ch',
        phone: '+41 79 300 23 01',
        salutation: 'MR',
        relationship: 'FATHER',
        isPrimary: true,
        occupation: 'Pilot',
      },
    ],
    children: [
      {
        firstName: 'Matteo',
        lastName: 'Jenni',
        dateOfBirth: '2017-04-03',
        gender: 'MALE',
        stage: 'abgelehnt',
        source: 'MANUAL',
        daysInStage: 18,
      },
    ],
  },

  // -- Two-child families (siblings share a Family + contact persons) --
  {
    familyName: 'Familie Steiner',
    parents: [
      {
        firstName: 'Petra',
        lastName: 'Steiner',
        email: 'petra.steiner@example.ch',
        phone: '+41 79 301 01 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Ärztin',
      },
      {
        firstName: 'Daniel',
        lastName: 'Steiner',
        email: 'daniel.steiner@example.ch',
        phone: '+41 79 301 01 02',
        salutation: 'MR',
        relationship: 'FATHER',
        occupation: 'Banker',
      },
    ],
    children: [
      {
        firstName: 'Emma',
        lastName: 'Steiner',
        dateOfBirth: '2018-02-11',
        gender: 'FEMALE',
        stage: 'aufnahmegespraech',
        source: 'PUBLIC_FORM',
        daysInStage: 12,
      },
      {
        firstName: 'Luca',
        lastName: 'Steiner',
        dateOfBirth: '2020-08-30',
        gender: 'MALE',
        stage: 'aufnahmegespraech',
        source: 'PUBLIC_FORM',
        daysInStage: 12,
      },
    ],
  },
  {
    familyName: 'Familie Bachmann',
    parents: [
      {
        firstName: 'Sabine',
        lastName: 'Bachmann',
        email: 'sabine.bachmann@example.ch',
        phone: '+41 79 301 02 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Sozialarbeiterin',
      },
      {
        firstName: 'Marco',
        lastName: 'Bachmann',
        email: 'marco.bachmann@example.ch',
        phone: '+41 79 301 02 02',
        salutation: 'MR',
        relationship: 'FATHER',
        occupation: 'Schreiner',
      },
    ],
    children: [
      {
        firstName: 'Nora',
        lastName: 'Bachmann',
        dateOfBirth: '2017-11-20',
        gender: 'FEMALE',
        stage: 'vertrag',
        source: 'REFERRAL',
        daysInStage: 19,
      },
      {
        firstName: 'Jonas',
        lastName: 'Bachmann',
        dateOfBirth: '2020-03-15',
        gender: 'MALE',
        stage: 'hospitation',
        source: 'REFERRAL',
        daysInStage: 3,
      },
    ],
  },
  {
    familyName: 'Familie Suter',
    parents: [
      {
        firstName: 'Andrea',
        lastName: 'Suter',
        email: 'andrea.suter@example.ch',
        phone: '+41 79 301 03 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
      },
    ],
    children: [
      {
        firstName: 'Finn',
        lastName: 'Suter',
        dateOfBirth: '2016-12-22',
        gender: 'MALE',
        stage: 'anfrage',
        source: 'OPEN_DAY',
        daysInStage: 4,
      },
      {
        firstName: 'Lia',
        lastName: 'Suter',
        dateOfBirth: '2019-07-08',
        gender: 'FEMALE',
        stage: 'anfrage',
        source: 'OPEN_DAY',
        daysInStage: 4,
      },
    ],
  },
  {
    familyName: 'Familie Wyss',
    parents: [
      {
        firstName: 'Karin',
        lastName: 'Wyss',
        email: 'karin.wyss@example.ch',
        phone: '+41 79 301 04 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Logopädin',
      },
      {
        firstName: 'Stefan',
        lastName: 'Wyss',
        email: 'stefan.wyss@example.ch',
        phone: '+41 79 301 04 02',
        salutation: 'MR',
        relationship: 'FATHER',
      },
    ],
    children: [
      {
        firstName: 'Anna',
        lastName: 'Wyss',
        dateOfBirth: '2017-09-29',
        gender: 'FEMALE',
        stage: 'hospitation',
        source: 'MANUAL',
        daysInStage: 10,
      },
      {
        firstName: 'Tim',
        lastName: 'Wyss',
        dateOfBirth: '2019-12-05',
        gender: 'MALE',
        stage: 'anfrage',
        source: 'MANUAL',
        daysInStage: 2,
      },
    ],
  },

  // -- More single-child families to reach 30+ applications --
  {
    familyName: 'Familie Bauer',
    parents: [
      {
        firstName: 'Simone',
        lastName: 'Bauer',
        email: 'simone.bauer@example.ch',
        phone: '+41 79 301 11 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Yoga-Lehrerin',
      },
    ],
    children: [
      {
        firstName: 'Levin',
        lastName: 'Bauer',
        dateOfBirth: '2018-10-08',
        gender: 'MALE',
        stage: 'anfrage',
        source: 'PUBLIC_FORM',
        daysInStage: 6,
      },
    ],
  },
  {
    familyName: 'Familie Zürcher',
    parents: [
      {
        firstName: 'Roman',
        lastName: 'Zürcher',
        email: 'roman.zuercher@example.ch',
        phone: '+41 79 301 12 01',
        salutation: 'MR',
        relationship: 'FATHER',
        isPrimary: true,
        occupation: 'Pflegefachmann',
      },
      {
        firstName: 'Nadja',
        lastName: 'Zürcher',
        email: 'nadja.zuercher@example.ch',
        phone: '+41 79 301 12 02',
        salutation: 'MRS',
        relationship: 'MOTHER',
      },
    ],
    children: [
      {
        firstName: 'Helga',
        lastName: 'Zürcher',
        dateOfBirth: '2019-02-19',
        gender: 'FEMALE',
        stage: 'hospitation',
        source: 'MANUAL',
        daysInStage: 9,
      },
    ],
  },
  {
    familyName: 'Familie Maurer',
    parents: [
      {
        firstName: 'Lukas',
        lastName: 'Maurer',
        email: 'lukas.maurer@example.ch',
        phone: '+41 79 301 13 01',
        salutation: 'MR',
        relationship: 'FATHER',
        isPrimary: true,
      },
    ],
    children: [
      {
        firstName: 'Jana',
        lastName: 'Maurer',
        dateOfBirth: '2017-06-25',
        gender: 'FEMALE',
        stage: 'aufnahmegespraech',
        source: 'OPEN_DAY',
        daysInStage: 5,
      },
    ],
  },
  {
    familyName: 'Familie Berger',
    parents: [
      {
        firstName: 'Eva',
        lastName: 'Berger',
        email: 'eva.berger@example.ch',
        phone: '+41 79 301 14 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Designerin',
      },
    ],
    children: [
      {
        firstName: 'Liam',
        lastName: 'Berger',
        dateOfBirth: '2020-05-12',
        gender: 'MALE',
        stage: 'anfrage',
        source: 'REFERRAL',
        daysInStage: 3,
      },
    ],
  },
  {
    familyName: 'Familie Studer',
    parents: [
      {
        firstName: 'Jonas',
        lastName: 'Studer',
        email: 'jonas.studer@example.ch',
        phone: '+41 79 301 15 01',
        salutation: 'MR',
        relationship: 'LEGAL_GUARDIAN',
        isPrimary: true,
      },
    ],
    children: [
      {
        firstName: 'Aaron',
        lastName: 'Studer',
        dateOfBirth: '2018-12-14',
        gender: 'MALE',
        stage: 'vertrag',
        source: 'MANUAL',
        daysInStage: 17,
      },
    ],
  },
  {
    familyName: 'Familie Schenk',
    parents: [
      {
        firstName: 'Ramona',
        lastName: 'Schenk',
        email: 'ramona.schenk@example.ch',
        phone: '+41 79 301 16 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
      },
    ],
    children: [
      {
        firstName: 'Maja',
        lastName: 'Schenk',
        dateOfBirth: '2019-08-02',
        gender: 'FEMALE',
        stage: 'abgelehnt',
        source: 'PUBLIC_FORM',
        daysInStage: 25,
      },
    ],
  },

  // -- One more two-child family --
  {
    familyName: 'Familie Eberle',
    parents: [
      {
        firstName: 'Pia',
        lastName: 'Eberle',
        email: 'pia.eberle@example.ch',
        phone: '+41 79 301 17 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        occupation: 'Journalistin',
      },
      {
        firstName: 'Sven',
        lastName: 'Eberle',
        email: 'sven.eberle@example.ch',
        phone: '+41 79 301 17 02',
        salutation: 'MR',
        relationship: 'FATHER',
        occupation: 'Mediziner',
      },
    ],
    children: [
      {
        firstName: 'Lena',
        lastName: 'Eberle',
        dateOfBirth: '2017-01-30',
        gender: 'FEMALE',
        stage: 'hospitation',
        source: 'MANUAL',
        daysInStage: 15,
      },
      {
        firstName: 'Samuel',
        lastName: 'Eberle',
        dateOfBirth: '2019-09-16',
        gender: 'MALE',
        stage: 'aufnahmegespraech',
        source: 'MANUAL',
        daysInStage: 8,
      },
    ],
  },

  // -- Three-child family --
  {
    familyName: 'Familie Räber',
    parents: [
      {
        firstName: 'Claudia',
        lastName: 'Räber',
        email: 'claudia.raeber@example.ch',
        phone: '+41 79 301 05 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
      },
      {
        firstName: 'Thomas',
        lastName: 'Räber',
        email: 'thomas.raeber@example.ch',
        phone: '+41 79 301 05 02',
        salutation: 'MR',
        relationship: 'FATHER',
        occupation: 'Polizist',
      },
    ],
    children: [
      {
        firstName: 'Helena',
        lastName: 'Räber',
        dateOfBirth: '2015-06-17',
        gender: 'FEMALE',
        stage: 'vertrag',
        source: 'REFERRAL',
        daysInStage: 22,
      },
      {
        firstName: 'Felix',
        lastName: 'Räber',
        dateOfBirth: '2018-01-25',
        gender: 'MALE',
        stage: 'aufnahmegespraech',
        source: 'REFERRAL',
        daysInStage: 7,
      },
      {
        firstName: 'Mira',
        lastName: 'Räber',
        dateOfBirth: '2021-04-04',
        gender: 'FEMALE',
        stage: 'anfrage',
        source: 'REFERRAL',
        daysInStage: 1,
      },
    ],
  },
];

// Contact persons (parents/guardians) to add — keyed by student lastname so we
// can wire up the relationship below.
// The "Klasse PA" roster: Levin Baumann (the student the curriculum/Hattie
// demo data below is written for) plus four classmates. Each entry doubles as
// (a) the source for the admission-application → finalizeEnrollment flow that
// creates the real `students` + `school_class_enrollments` rows via
// AdmissionApplicationsService, and (b) the source for the legacy `contacts`
// list that seeds parent/guardian ContactPersons directly on the *enrolled*
// student (mirroring what finalizeEnrollment does for the family's own
// contacts, but this list additionally covers non-family emergency contacts
// like grandparents that were never part of the admission application).
const KLASSE_PA_STUDENTS: {
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  contacts: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    salutation: 'MR' | 'MRS' | 'DIVERSE' | 'NONE';
    relationship:
      | 'MOTHER'
      | 'FATHER'
      | 'STEP_MOTHER'
      | 'STEP_FATHER'
      | 'GRANDMOTHER'
      | 'GRANDFATHER'
      | 'LEGAL_GUARDIAN'
      | 'NANNY'
      | 'AUNT_UNCLE';
    isPrimary?: boolean;
    livesWith?: boolean;
    emergencyPriority?: number;
  }[];
}[] = [
  {
    studentFirstName: 'Levin',
    studentLastName: 'Baumann',
    dateOfBirth: '2018-03-14',
    gender: 'MALE',
    contacts: [
      {
        firstName: 'Sabine',
        lastName: 'Baumann',
        email: 'sabine.baumann@example.ch',
        phone: '+41 79 200 11 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        livesWith: true,
        emergencyPriority: 1,
      },
      {
        firstName: 'Markus',
        lastName: 'Baumann',
        email: 'markus.baumann@example.ch',
        phone: '+41 79 200 11 02',
        salutation: 'MR',
        relationship: 'FATHER',
        livesWith: true,
        emergencyPriority: 2,
      },
      {
        firstName: 'Heidi',
        lastName: 'Baumann',
        phone: '+41 79 200 11 03',
        salutation: 'MRS',
        relationship: 'GRANDMOTHER',
        emergencyPriority: 3,
      },
    ],
  },
  {
    studentFirstName: 'Mia',
    studentLastName: 'Müller',
    dateOfBirth: '2018-07-02',
    gender: 'FEMALE',
    contacts: [
      {
        firstName: 'Claudia',
        lastName: 'Müller',
        email: 'claudia.mueller@example.ch',
        phone: '+41 79 200 12 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        livesWith: true,
        emergencyPriority: 1,
      },
      {
        firstName: 'Peter',
        lastName: 'Müller',
        email: 'peter.mueller@example.ch',
        phone: '+41 79 200 12 02',
        salutation: 'MR',
        relationship: 'FATHER',
        livesWith: true,
        emergencyPriority: 2,
      },
    ],
  },
  {
    studentFirstName: 'Finn',
    studentLastName: 'Keller',
    dateOfBirth: '2018-01-25',
    gender: 'MALE',
    contacts: [
      {
        firstName: 'Andrea',
        lastName: 'Keller',
        email: 'andrea.keller@example.ch',
        phone: '+41 79 200 13 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        livesWith: true,
        emergencyPriority: 1,
      },
      {
        firstName: 'Stefan',
        lastName: 'Hartmann',
        email: 'stefan.hartmann@example.ch',
        phone: '+41 79 200 13 02',
        salutation: 'MR',
        relationship: 'STEP_FATHER',
        livesWith: true,
        emergencyPriority: 2,
      },
    ],
  },
  {
    studentFirstName: 'Emma',
    studentLastName: 'Schmid',
    dateOfBirth: '2018-11-09',
    gender: 'FEMALE',
    contacts: [
      {
        firstName: 'Karin',
        lastName: 'Schmid',
        email: 'karin.schmid@example.ch',
        phone: '+41 79 200 14 01',
        salutation: 'MRS',
        relationship: 'MOTHER',
        isPrimary: true,
        livesWith: true,
        emergencyPriority: 1,
      },
      {
        firstName: 'Roland',
        lastName: 'Schmid',
        email: 'roland.schmid@example.ch',
        phone: '+41 79 200 14 02',
        salutation: 'MR',
        relationship: 'FATHER',
        emergencyPriority: 2,
      },
    ],
  },
  {
    studentFirstName: 'Noah',
    studentLastName: 'Brunner',
    dateOfBirth: '2018-05-30',
    gender: 'MALE',
    contacts: [
      {
        firstName: 'Ursula',
        lastName: 'Brunner',
        email: 'ursula.brunner@example.ch',
        phone: '+41 79 200 15 01',
        salutation: 'MRS',
        relationship: 'LEGAL_GUARDIAN',
        isPrimary: true,
        livesWith: true,
        emergencyPriority: 1,
      },
    ],
  },
];

// Lesson records for Levin — varied mastery per AREA so the radar shows
// distinct values per axis.
const LEVIN_AREA_RECORDS: {
  areaName: string;
  lessons: number;
  statuses: string[];
}[] = [
  {
    areaName: 'Mathematik',
    lessons: 5,
    statuses: ['MASTERED', 'MASTERED', 'MASTERED', 'MASTERED', 'PRACTICED'],
  },
  {
    areaName: 'Sprache',
    lessons: 5,
    statuses: ['MASTERED', 'MASTERED', 'PRACTICED', 'PRACTICED', 'PRACTICED'],
  },
  {
    areaName: 'Sinnesmaterial',
    lessons: 4,
    statuses: ['MASTERED', 'MASTERED', 'MASTERED', 'NEEDS_MORE'],
  },
  {
    areaName: 'Übungen des Praktischen Lebens',
    lessons: 4,
    statuses: ['MASTERED', 'MASTERED', 'MASTERED', 'MASTERED'],
  },
  {
    areaName: 'Biologie',
    lessons: 3,
    statuses: ['MASTERED', 'INTRODUCED', 'INTRODUCED'],
  },
  {
    areaName: 'Geografie',
    lessons: 3,
    statuses: ['MASTERED', 'PRACTICED', 'PRACTICED'],
  },
  {
    areaName: 'Geomertrie',
    lessons: 3,
    statuses: ['MASTERED', 'MASTERED', 'PRACTICED'],
  },
  {
    areaName: 'Geschichte',
    lessons: 2,
    statuses: ['INTRODUCED', 'INTRODUCED'],
  },
];

async function main() {
  const c = new Client(DB);
  await c.connect();
  console.log('▶ Connected (pg)');

  // -------- 0. Bootstrap NestJS application context + org (findOrCreate) ---
  // We boot the real Nest app (no HTTP listener — createApplicationContext)
  // so org creation runs through the real OrganizationsService.create(),
  // which transactionally seeds system roles, role permissions, absence
  // categories, employee functions, admission stages/sources and feature
  // toggles as a side effect. That is the same logic production uses when a
  // SuperAdmin creates an org via GraphQL — re-implementing it in raw SQL
  // here would be exactly the kind of drift this rewrite is meant to avoid.
  //
  // Dynamic import so `reflect-metadata`/env vars above are guaranteed to run
  // first, and so a `pg`-only failure (e.g. DB not reachable) surfaces before
  // we pay the cost of loading the whole Nest dependency graph.
  const { AppModule } = await import('../src/app.module');
  const { OrganizationsService } =
    await import('../src/organizations/organizations.service');
  const { AdmissionApplicationsService } =
    await import('../src/school-management/admissions/admission-applications.service');

  console.log('▶ Booting NestJS application context…');
  const app: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    });
  console.log('✓ NestJS application context ready');

  const orgsService = app.get(OrganizationsService);
  const admissionsService = app.get(AdmissionApplicationsService);

  // find-or-create by name — idempotent across re-runs.
  const { rows: existingOrgRows } = await c.query<{ id: string }>(
    `SELECT id FROM organizations WHERE name = $1 LIMIT 1`,
    [ORG_NAME],
  );
  let ORG_ID: string;
  if (existingOrgRows[0]) {
    ORG_ID = existingOrgRows[0].id;
    console.log(`✓ Org "${ORG_NAME}" already exists (${ORG_ID})`);
  } else {
    const created = await orgsService.create({
      organizationName: ORG_NAME,
      organizationSubdomain: ORG_SUBDOMAIN,
      country: 'CH',
      timezone: 'Europe/Zurich',
    });
    ORG_ID = created.id;
    console.log(`✓ Org "${ORG_NAME}" created (${ORG_ID})`);
  }

  // Verify the side effects actually fired instead of assuming they did —
  // OrganizationsService.create() is expected to seed exactly the 6 system
  // roles via seedOrgSystemRoles(manager, org.id).
  const { rows: systemRoleRows } = await c.query<{ system_code: string }>(
    `SELECT system_code FROM roles WHERE organization_id = $1 AND is_system = true`,
    [ORG_ID],
  );
  const EXPECTED_SYSTEM_ROLES = [
    'ORG_OWNER',
    'ORG_ADMIN',
    'HR_MANAGER',
    'OFFICE',
    'TEAM_LEAD',
    'EMPLOYEE',
  ];
  const seededRoleCodes = new Set(systemRoleRows.map((r) => r.system_code));
  const missingRoles = EXPECTED_SYSTEM_ROLES.filter(
    (code) => !seededRoleCodes.has(code),
  );
  if (missingRoles.length > 0) {
    throw new Error(
      `System roles missing after org creation: ${missingRoles.join(', ')}. ` +
        `OrganizationsService.create() should have seeded these via seedOrgSystemRoles — aborting.`,
    );
  }
  console.log(
    `✓ System roles verified (${systemRoleRows.length}: ${[...seededRoleCodes].join(', ')})`,
  );

  // -------- 2. Patch role permissions --------
  for (const [roleCode, perms] of Object.entries(ROLE_PERMS)) {
    const { rows: roleRows } = await c.query<{ id: string }>(
      `SELECT id FROM roles WHERE organization_id = $1 AND system_code = $2`,
      [ORG_ID, roleCode],
    );
    if (!roleRows[0]) continue;
    for (const p of perms) {
      const { rows: permRows } = await c.query<{ id: string }>(
        `SELECT id FROM permissions WHERE code = $1`,
        [p],
      );
      if (!permRows[0]) continue;
      await c.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [roleRows[0].id, permRows[0].id],
      );
    }
  }
  console.log('✓ Role permissions patched');

  // -------- 3. Admission stages --------
  for (const s of STAGES) {
    await c.query(
      `INSERT INTO admission_stages (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            name, slug, color, position, stage_type, is_default, organization_id)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (organization_id, slug) DO NOTHING`,
      [
        randomUUID(),
        s.name,
        s.slug,
        s.color,
        s.position,
        s.stage_type,
        s.is_default,
        ORG_ID,
      ],
    );
  }
  console.log(`✓ Admission stages (${STAGES.length})`);

  // -------- 4. Grade levels (additive) --------
  for (const g of NEW_GRADE_LEVELS) {
    await c.query(
      `INSERT INTO grade_levels (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            name, color, "sortOrder", organization_id)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5)
       ON CONFLICT (organization_id, name) DO NOTHING`,
      [randomUUID(), g.name, g.color, g.sortOrder, ORG_ID],
    );
  }
  console.log(`✓ Grade levels (+${NEW_GRADE_LEVELS.length})`);

  // Backfill colours for grade-levels that exist but have NULL/empty color.
  let glColorsBackfilled = 0;
  for (const [name, color] of Object.entries(GRADE_LEVEL_COLOR_DEFAULTS)) {
    const { rowCount } = await c.query(
      `UPDATE grade_levels
          SET color = $1
        WHERE organization_id = $2
          AND name = $3
          AND (color IS NULL OR color = '')`,
      [color, ORG_ID, name],
    );
    glColorsBackfilled += rowCount ?? 0;
  }
  if (glColorsBackfilled > 0) {
    console.log(`✓ Grade-level colours backfilled (+${glColorsBackfilled})`);
  }

  // -------- 5. School classes --------
  for (const cls of NEW_CLASSES) {
    const { rows: existing } = await c.query(
      `SELECT id FROM school_classes WHERE organization_id = $1 AND name = $2`,
      [ORG_ID, cls.name],
    );
    if (existing[0]) continue;
    const classId = randomUUID();
    await c.query(
      `INSERT INTO school_classes (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            name, color, "sortOrder", "maxCapacity", room, organization_id)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, 0, $4, $5, $6)`,
      [classId, cls.name, cls.color, cls.maxCapacity, cls.room, ORG_ID],
    );
    // Link grade level
    const { rows: glRows } = await c.query<{ id: string }>(
      `SELECT id FROM grade_levels WHERE organization_id = $1 AND name = $2`,
      [ORG_ID, cls.gradeLevel],
    );
    if (glRows[0]) {
      await c.query(
        `INSERT INTO school_class_grade_levels ("schoolClassesId", "gradeLevelsId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [classId, glRows[0].id],
      );
    }
  }
  console.log(`✓ School classes (+${NEW_CLASSES.length})`);

  // -------- 5b. Curriculum import (Excel → CurriculaImportService) --------
  // Must run before section 9 (lesson records) — the base install has no
  // curriculum at all.
  await seedCurriculaFromXlsx(app, c, ORG_ID);

  // -------- 6. Test users (better-auth + app users + membership + employee) --------
  const pwHash = await hashPassword(PW_PLAIN);
  const teacherEmployeeIds: string[] = [];

  for (const u of USERS) {
    const ids = await ensureStaffUser(c, ORG_ID, u, pwHash);
    if (!ids.created) console.log(`  · ${u.email} already exists — skipping`);
    if (u.isTeacher) teacherEmployeeIds.push(ids.employeeId);
  }
  console.log(`✓ Test users (${USERS.length})`);

  // -------- 7. Assign teachers to ALL classes (M:N) --------
  const { rows: allClasses } = await c.query<{ id: string; name: string }>(
    `SELECT id, name FROM school_classes WHERE organization_id = $1 ORDER BY name`,
    [ORG_ID],
  );
  // Round-robin spread: each teacher gets 1-2 classes
  for (let i = 0; i < allClasses.length; i++) {
    const cls = allClasses[i];
    // Two teachers per class (primary + co-teacher) where possible
    const a = teacherEmployeeIds[i % teacherEmployeeIds.length];
    const b = teacherEmployeeIds[(i + 1) % teacherEmployeeIds.length];
    for (const empId of [a, b]) {
      if (!empId) continue;
      await c.query(
        `INSERT INTO school_class_teachers (school_class_id, employee_id, organization_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [cls.id, empId, ORG_ID],
      );
    }
  }
  console.log(`✓ Teachers assigned to ${allClasses.length} classes`);

  // -------- 7b. Admission → enrollment: Klasse PA roster --------
  // Levin Baumann + classmates need real `students` + `school_class_enrollments`
  // rows before section 9 (lesson records / Hattie axes) or section 8 (contact
  // persons) can do anything. Route them through the real admission pipeline
  // (AdmissionApplicationsService.create + .finalizeEnrollment) instead of
  // hand-writing `students`/`school_class_enrollments` INSERTs, so the same
  // business logic production uses (contact-person mirroring, application
  // status transition, audit log) runs here too.
  const { rows: paClassRows } = await c.query<{ id: string }>(
    `SELECT id FROM school_classes WHERE organization_id = $1 AND name = $2 LIMIT 1`,
    [ORG_ID, PA_CLASS_NAME],
  );
  const paClassId = paClassRows[0]?.id;
  if (!paClassId) {
    console.warn(
      `⚠ "${PA_CLASS_NAME}" not found — skipping Klasse-PA enrollment`,
    );
  } else {
    let paEnrolled = 0;
    for (const stu of KLASSE_PA_STUDENTS) {
      // Idempotency: skip if this student already exists (name + dob unique
      // per org, matching the Student entity's own unique index).
      const { rows: existingStudent } = await c.query<{ id: string }>(
        `SELECT id FROM students
          WHERE organization_id = $1 AND "firstName" = $2 AND "lastName" = $3 AND "dateOfBirth" = $4`,
        [ORG_ID, stu.studentFirstName, stu.studentLastName, stu.dateOfBirth],
      );
      if (existingStudent[0]) continue;

      const application = await admissionsService.create(
        {
          familyName: `Familie ${stu.studentLastName}`,
          childFirstName: stu.studentFirstName,
          childLastName: stu.studentLastName,
          childDateOfBirth: stu.dateOfBirth,
          childGender: stu.gender as never,
          contactPersons: stu.contacts.map((cp, idx) => ({
            firstName: cp.firstName,
            lastName: cp.lastName,
            email: cp.email,
            phone: cp.phone,
            salutation: cp.salutation as never,
            roles: [cp.relationship as never],
            sortOrder: idx,
          })),
        },
        ORG_ID,
        null,
      );
      await admissionsService.finalizeEnrollment(
        {
          applicationId: application.id,
          schoolClassId: paClassId,
          enrollmentDate: '2025-08-18',
        },
        ORG_ID,
        null,
      );
      paEnrolled++;
    }
    console.log(`✓ Klasse-PA roster enrolled (+${paEnrolled})`);
  }

  // -------- 8. Contact persons + relationships --------
  let cpAdded = 0;
  for (const block of KLASSE_PA_STUDENTS) {
    const { rows: studRows } = await c.query<{ id: string }>(
      `SELECT id FROM students WHERE organization_id = $1 AND "lastName" = $2 LIMIT 1`,
      [ORG_ID, block.studentLastName],
    );
    const studentId = studRows[0]?.id;
    if (!studentId) continue;

    for (const cp of block.contacts) {
      // idempotency: name + student combination
      const { rows: existing } = await c.query<{ id: string }>(
        `SELECT cp.id FROM contact_persons cp
         JOIN student_contact_persons scp ON scp.contact_person_id = cp.id
         WHERE cp.organization_id = $1
           AND cp.first_name = $2 AND cp.last_name = $3
           AND scp.student_id = $4
         LIMIT 1`,
        [ORG_ID, cp.firstName, cp.lastName, studentId],
      );
      if (existing[0]) continue;

      const cpId = randomUUID();
      await c.query(
        `INSERT INTO contact_persons (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              first_name, last_name, salutation, email, phone, organization_id)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, $7)`,
        [
          cpId,
          cp.firstName,
          cp.lastName,
          cp.salutation,
          cp.email ?? null,
          cp.phone ?? null,
          ORG_ID,
        ],
      );
      await c.query(
        `INSERT INTO student_contact_persons (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              student_id, contact_person_id, relationship_type, is_primary_contact, has_custody,
              is_pickup_authorized, emergency_priority, lives_with_student, organization_id)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, true, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [
          randomUUID(),
          studentId,
          cpId,
          cp.relationship,
          cp.isPrimary ?? false,
          cp.relationship === 'LEGAL_GUARDIAN' ||
            cp.relationship === 'MOTHER' ||
            cp.relationship === 'FATHER',
          cp.emergencyPriority ?? null,
          cp.livesWith ?? false,
          ORG_ID,
        ],
      );
      cpAdded++;
    }
  }
  console.log(`✓ Contact persons + relationships (+${cpAdded})`);

  // -------- 9. Lesson records for Levin Baumann --------
  const { rows: levinRows } = await c.query<{ id: string }>(
    `SELECT id FROM students WHERE organization_id = $1 AND "firstName" = 'Levin' AND "lastName" = 'Baumann' LIMIT 1`,
    [ORG_ID],
  );
  const levinId = levinRows[0]?.id;
  if (!levinId) {
    console.warn('⚠ Levin Baumann not found — skipping lesson records');
  } else {
    let lrAdded = 0;
    const baseDate = new Date('2026-04-01');
    let dayOffset = 0;
    for (const a of LEVIN_AREA_RECORDS) {
      // Find the AREA node by name (prefers DE translation)
      const { rows: areaRows } = await c.query<{ id: string }>(
        `SELECT n.id
         FROM curriculum_nodes n
         JOIN curriculum_node_translations t
              ON t.curriculum_node_id = n.id AND t.locale = 'DE'
         WHERE n.organization_id = $1
           AND n.node_type = 'AREA'
           AND t.name = $2
         ORDER BY n.position
         LIMIT 1`,
        [ORG_ID, a.areaName],
      );
      if (!areaRows[0]) continue;
      const areaId = areaRows[0].id;

      // Walk down to LESSON descendants
      const { rows: lessonRows } = await c.query<{ id: string }>(
        `WITH RECURSIVE descendants AS (
            SELECT id, parent_id, node_type, position
            FROM curriculum_nodes
            WHERE id = $1
          UNION ALL
            SELECT n.id, n.parent_id, n.node_type, n.position
            FROM curriculum_nodes n
            JOIN descendants d ON n.parent_id = d.id
         )
         SELECT id FROM descendants
         WHERE node_type = 'LESSON'
         ORDER BY position
         LIMIT $2`,
        [areaId, a.lessons],
      );

      for (let i = 0; i < lessonRows.length; i++) {
        const lessonId = lessonRows[i].id;
        const status = a.statuses[i] ?? 'PRACTICED';
        const d = new Date(baseDate);
        d.setDate(d.getDate() + dayOffset++);
        const dateStr = d.toISOString().slice(0, 10);

        // Idempotency: don't insert if a record for this student+lesson+date exists
        const { rows: dup } = await c.query(
          `SELECT 1 FROM lesson_records
           WHERE student_id = $1 AND lesson_id = $2 AND recorded_at = $3`,
          [levinId, lessonId, dateStr],
        );
        if (dup[0]) continue;

        await c.query(
          `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                student_id, lesson_id, recorded_at, status, organization_id)
           VALUES ($1, 1, true, false, now(), now(), $2, $3, $4::date, $5::lesson_records_status_enum, $6)`,
          [randomUUID(), levinId, lessonId, dateStr, status, ORG_ID],
        );
        lrAdded++;
      }
    }
    console.log(`✓ Lesson records for Levin (+${lrAdded})`);

    // -------- 9b. Many more records for Levin --------
    // Picks the top 14 AREAs by descendant LESSON count and seeds 6–12
    // lessons each with a per-area "mastery profile" so the radar shows a
    // nicely-nested progression. Idempotent — skips any (student, lesson)
    // pair that already has a record.
    const PROFILES: Array<{
      mastered: number;
      practiced: number;
      introduced: number;
      needsMore: number;
      lessons: number;
    }> = [
      {
        mastered: 0.65,
        practiced: 0.2,
        introduced: 0.1,
        needsMore: 0.05,
        lessons: 12,
      }, // very advanced
      {
        mastered: 0.5,
        practiced: 0.3,
        introduced: 0.15,
        needsMore: 0.05,
        lessons: 10,
      }, // advanced
      {
        mastered: 0.4,
        practiced: 0.35,
        introduced: 0.2,
        needsMore: 0.05,
        lessons: 10,
      }, // good
      {
        mastered: 0.3,
        practiced: 0.35,
        introduced: 0.3,
        needsMore: 0.05,
        lessons: 9,
      }, // solid
      {
        mastered: 0.25,
        practiced: 0.3,
        introduced: 0.4,
        needsMore: 0.05,
        lessons: 8,
      }, // mid
      {
        mastered: 0.15,
        practiced: 0.3,
        introduced: 0.5,
        needsMore: 0.05,
        lessons: 8,
      }, // mid-low
      {
        mastered: 0.1,
        practiced: 0.25,
        introduced: 0.55,
        needsMore: 0.1,
        lessons: 7,
      }, // building
      {
        mastered: 0.1,
        practiced: 0.2,
        introduced: 0.6,
        needsMore: 0.1,
        lessons: 7,
      }, // building
      {
        mastered: 0.05,
        practiced: 0.2,
        introduced: 0.7,
        needsMore: 0.05,
        lessons: 6,
      }, // early
      {
        mastered: 0.05,
        practiced: 0.15,
        introduced: 0.75,
        needsMore: 0.05,
        lessons: 6,
      }, // early
      {
        mastered: 0.0,
        practiced: 0.2,
        introduced: 0.75,
        needsMore: 0.05,
        lessons: 6,
      }, // just-started
      {
        mastered: 0.0,
        practiced: 0.15,
        introduced: 0.85,
        needsMore: 0.0,
        lessons: 5,
      }, // just-started
      {
        mastered: 0.1,
        practiced: 0.3,
        introduced: 0.55,
        needsMore: 0.05,
        lessons: 6,
      }, // mid
      {
        mastered: 0.2,
        practiced: 0.3,
        introduced: 0.45,
        needsMore: 0.05,
        lessons: 6,
      }, // building
    ];

    const { rows: rankedAreas } = await c.query<{
      id: string;
      name: string;
      lesson_count: string;
    }>(
      `WITH RECURSIVE areas AS (
         SELECT id AS root_id, id, parent_id, node_type
         FROM curriculum_nodes
         WHERE organization_id = $1 AND node_type = 'AREA'
       UNION ALL
         SELECT a.root_id, n.id, n.parent_id, n.node_type
         FROM curriculum_nodes n
         JOIN areas a ON n.parent_id = a.id
       )
       SELECT a.root_id AS id,
              COALESCE(t.name, a.root_id::text) AS name,
              COUNT(*) FILTER (WHERE a.node_type = 'LESSON') AS lesson_count
       FROM areas a
       LEFT JOIN curriculum_node_translations t
              ON t.curriculum_node_id = a.root_id AND t.locale = 'DE'
       GROUP BY a.root_id, t.name
       HAVING COUNT(*) FILTER (WHERE a.node_type = 'LESSON') > 0
       ORDER BY lesson_count DESC
       LIMIT $2`,
      [ORG_ID, PROFILES.length],
    );

    let lrAdded2 = 0;
    let dayOffset2 = 0;
    const baseDate2 = new Date('2025-11-15'); // ~6 months back for time-series
    for (let i = 0; i < rankedAreas.length; i++) {
      const area = rankedAreas[i];
      const profile = PROFILES[i];

      // Pull lessons from this AREA's descendants that DON'T yet have a
      // record for Levin (so re-runs only ever add missing ones).
      const { rows: lessons } = await c.query<{ id: string }>(
        `WITH RECURSIVE descendants AS (
           SELECT id, parent_id, node_type, position
           FROM curriculum_nodes WHERE id = $1
         UNION ALL
           SELECT n.id, n.parent_id, n.node_type, n.position
           FROM curriculum_nodes n
           JOIN descendants d ON n.parent_id = d.id
         )
         SELECT d.id
         FROM descendants d
         WHERE d.node_type = 'LESSON'
           AND NOT EXISTS (
             SELECT 1 FROM lesson_records lr
             WHERE lr.student_id = $2 AND lr.lesson_id = d.id
           )
         ORDER BY d.position
         LIMIT $3`,
        [area.id, levinId, profile.lessons],
      );

      // Materialise the status sequence for this area based on the profile.
      const seq: string[] = [];
      const mCount = Math.round(profile.mastered * lessons.length);
      const pCount = Math.round(profile.practiced * lessons.length);
      const iCount = Math.round(profile.introduced * lessons.length);
      const nmCount = Math.max(0, lessons.length - mCount - pCount - iCount);
      for (let k = 0; k < mCount; k++) seq.push('MASTERED');
      for (let k = 0; k < pCount; k++) seq.push('PRACTICED');
      for (let k = 0; k < iCount; k++) seq.push('INTRODUCED');
      for (let k = 0; k < nmCount; k++) seq.push('NEEDS_MORE');

      for (let j = 0; j < lessons.length; j++) {
        const status = seq[j] ?? 'INTRODUCED';
        const d = new Date(baseDate2);
        d.setDate(d.getDate() + dayOffset2++);
        const dateStr = d.toISOString().slice(0, 10);
        await c.query(
          `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                student_id, lesson_id, recorded_at, status, organization_id)
           VALUES ($1, 1, true, false, now(), now(),
                $2, $3, $4::date, $5::lesson_records_status_enum, $6)`,
          [randomUUID(), levinId, lessons[j].id, dateStr, status, ORG_ID],
        );
        lrAdded2++;
      }
    }
    console.log(
      `✓ Rich Levin records across ${rankedAreas.length} areas (+${lrAdded2})`,
    );

    // -------- 9c. Backfill realistic progression history --------
    // For every Levin lesson whose "highest" status is MASTERED or
    // PRACTICED, ensure earlier I→P records exist so the lifecycle
    // timeline shows a real progression (intro → geübt → gemeistert)
    // instead of a single dot.
    //
    // Backfill rows are tagged with a marker in `note` so we can wipe and
    // re-create them on each seed run — that lets offset tweaks above
    // actually take effect on existing dev databases.
    const BACKFILL_NOTE = '__seed_backfill__';

    // Org-weit putzen, damit auch die Mitschüler (Section 9f) bei jedem
    // Re-Run frisch generiert werden.
    const { rowCount: backfillCleared } = await c.query(
      `DELETE FROM lesson_records WHERE organization_id = $1 AND note = $2`,
      [ORG_ID, BACKFILL_NOTE],
    );
    if (backfillCleared) {
      console.log(
        `  · cleared ${backfillCleared} stale backfill rows org-wide (will recreate)`,
      );
    }

    const STATUS_RANK: Record<string, number> = {
      PLANNING: 0,
      INTRODUCED: 1,
      NEEDS_MORE: 1,
      PRACTICED: 2,
      MASTERED: 3,
    };

    const { rows: lessonStats } = await c.query<{
      lesson_id: string;
      earliest: string;
      top_status: string;
      has_introduced: boolean;
      has_practiced: boolean;
      has_mastered: boolean;
    }>(
      `SELECT lesson_id,
              MIN(recorded_at)::date::text AS earliest,
              -- highest progression status reached so far
              CASE
                WHEN bool_or(status = 'MASTERED')   THEN 'MASTERED'
                WHEN bool_or(status = 'PRACTICED')  THEN 'PRACTICED'
                WHEN bool_or(status = 'INTRODUCED') THEN 'INTRODUCED'
                WHEN bool_or(status = 'NEEDS_MORE') THEN 'NEEDS_MORE'
                ELSE 'PLANNING'
              END AS top_status,
              bool_or(status = 'INTRODUCED') AS has_introduced,
              bool_or(status = 'PRACTICED')  AS has_practiced,
              bool_or(status = 'MASTERED')   AS has_mastered
       FROM lesson_records
       WHERE student_id = $1
       GROUP BY lesson_id`,
      [levinId],
    );

    let backfillAdded = 0;
    for (const s of lessonStats) {
      const rank = STATUS_RANK[s.top_status] ?? 0;
      if (rank < 2) continue; // INTRODUCED only → nothing to backfill

      const earliestDate = new Date(s.earliest + 'T00:00:00Z');
      const inserts: { status: string; offsetDays: number }[] = [];

      // Per-lesson offsets, deterministic but varied so each lesson timeline
      // looks unique instead of all backfills landing on the same dates.
      //   INTRODUCED: 70..180 days before the earliest existing record
      //   PRACTICED:  15..60  days before the earliest existing record
      // Minimum gap between the two is 10 days (180→60 worst case is 120).
      const introOffset = -pickInRange(s.lesson_id, 'intro', 70, 180);
      const practicedOffset = -pickInRange(s.lesson_id, 'practiced', 15, 60);

      // For PRACTICED & MASTERED: need an INTRODUCED earlier than the
      // earliest existing record.
      if (!s.has_introduced) {
        inserts.push({ status: 'INTRODUCED', offsetDays: introOffset });
      }
      // For MASTERED: also need a PRACTICED between INTRODUCED and the
      // current MASTERED date.
      if (rank === 3 && !s.has_practiced) {
        inserts.push({ status: 'PRACTICED', offsetDays: practicedOffset });
      }

      for (const ins of inserts) {
        const d = new Date(earliestDate);
        d.setUTCDate(d.getUTCDate() + ins.offsetDays);
        const dateStr = d.toISOString().slice(0, 10);
        await c.query(
          `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                student_id, lesson_id, recorded_at, status, organization_id, note)
           VALUES ($1, 1, true, false, now(), now(),
                $2, $3, $4::date, $5::lesson_records_status_enum, $6, $7)`,
          [
            randomUUID(),
            levinId,
            s.lesson_id,
            dateStr,
            ins.status,
            ORG_ID,
            BACKFILL_NOTE,
          ],
        );
        backfillAdded++;
      }
    }
    console.log(
      `✓ Backfilled progression records for Levin (+${backfillAdded})`,
    );

    // -------- 9d. Multi-transition demo records --------
    // Echte Klassen-Realität: eine Lektion kann mehrmals eingeführt /
    // geübt / gemeistert werden (Regression → Re-Mastery). Wir streuen
    // für ~15 von Levins fortgeschrittensten Lektionen einen
    // zusätzlichen Mid-Cycle-Record ein, damit der Detail-Verlauf
    // (LessonLifecycleList → DetailHistory) das auch visualisiert.
    //
    // Pattern:
    //   - 7 mastered lessons bekommen NEEDS_MORE 10–25 Tage NACH dem
    //     ersten MASTERED + einen erneuten MASTERED 20–40 Tage später
    //     (Regression → recovered)
    //   - 5 practiced lessons bekommen einen zweiten PRACTICED-Record
    //     5–15 Tage nach dem ersten (Wiederholung der Übung)
    //   - 3 mastered lessons bekommen einen zweiten INTRODUCED kurz vor
    //     dem ersten PRACTICED (Lehrer hat die Einführung wiederholt)
    //
    // Idempotent über deterministischen Datum-Stempel via Hash —
    // wiederholte Runs erzeugen exakt dieselben Datums und werden
    // dank UNIQUE-Konflikt-Check übersprungen.
    type LessonHistory = {
      lessonId: string;
      firstIntroduced: string | null;
      firstPracticed: string | null;
      firstMastered: string | null;
    };
    const { rows: lessonHistories } = await c.query<LessonHistory>(
      `SELECT lesson_id AS "lessonId",
              MIN(recorded_at) FILTER (WHERE status = 'INTRODUCED')::date::text AS "firstIntroduced",
              MIN(recorded_at) FILTER (WHERE status = 'PRACTICED')::date::text  AS "firstPracticed",
              MIN(recorded_at) FILTER (WHERE status = 'MASTERED')::date::text   AS "firstMastered"
       FROM lesson_records
       WHERE student_id = $1
       GROUP BY lesson_id`,
      [levinId],
    );

    const mastered = lessonHistories.filter((h) => h.firstMastered);
    const practicedOnly = lessonHistories.filter(
      (h) => h.firstPracticed && !h.firstMastered,
    );

    const addDays = (d: string, n: number) => {
      const date = new Date(d + 'T00:00:00Z');
      date.setUTCDate(date.getUTCDate() + n);
      return date.toISOString().slice(0, 10);
    };

    const insertIfMissing = async (
      lessonId: string,
      date: string,
      status: string,
    ) => {
      const { rows: dup } = await c.query(
        `SELECT 1 FROM lesson_records
         WHERE student_id = $1 AND lesson_id = $2 AND recorded_at = $3
           AND status = $4::lesson_records_status_enum`,
        [levinId, lessonId, date, status],
      );
      if (dup[0]) return false;
      await c.query(
        `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              student_id, lesson_id, recorded_at, status, organization_id)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4::date, $5::lesson_records_status_enum, $6)`,
        [randomUUID(), levinId, lessonId, date, status, ORG_ID],
      );
      return true;
    };

    let multiAdded = 0;
    // Pattern A: Regression → recovered (NEEDS_MORE + re-MASTERED)
    for (const h of mastered.slice(0, 7)) {
      if (!h.firstMastered) continue;
      const offsetNm = pickInRange(h.lessonId, 'nm', 10, 25);
      const offsetReM = offsetNm + pickInRange(h.lessonId, 'rem', 20, 40);
      if (
        await insertIfMissing(
          h.lessonId,
          addDays(h.firstMastered, offsetNm),
          'NEEDS_MORE',
        )
      )
        multiAdded++;
      if (
        await insertIfMissing(
          h.lessonId,
          addDays(h.firstMastered, offsetReM),
          'MASTERED',
        )
      )
        multiAdded++;
    }
    // Pattern B: zweiter PRACTICED-Record (Wiederholung)
    for (const h of practicedOnly.slice(0, 5)) {
      if (!h.firstPracticed) continue;
      const offset = pickInRange(h.lessonId, 'rep', 5, 15);
      if (
        await insertIfMissing(
          h.lessonId,
          addDays(h.firstPracticed, offset),
          'PRACTICED',
        )
      )
        multiAdded++;
    }
    // Pattern C: zweiter INTRODUCED kurz vor PRACTICED (Re-Einführung)
    for (const h of mastered.slice(7, 10)) {
      if (!h.firstPracticed) continue;
      const offset = -pickInRange(h.lessonId, 'reintro', 2, 7);
      if (
        await insertIfMissing(
          h.lessonId,
          addDays(h.firstPracticed, offset),
          'INTRODUCED',
        )
      )
        multiAdded++;
    }
    console.log(`✓ Multi-transition demo records for Levin (+${multiAdded})`);

    // -------- 9e. Extra "geübt" sessions per lesson --------
    // Realistisch: eine Lektion wird mehrfach geübt, bevor sie gemeistert
    // wird. Wir streuen pro Lektion 2–5 zusätzliche PRACTICED-Records
    // zwischen INTRODUCED und dem nächsten Meilenstein (MASTERED, sonst
    // dem jüngsten vorhandenen Record). Deterministisch via Hash, getaggt
    // mit BACKFILL_NOTE → Re-Runs werden vom 9c-Cleanup automatisch
    // entfernt und neu generiert.
    const { rows: practiceTargets } = await c.query<{
      lessonId: string;
      firstIntroduced: string;
      upperBound: string;
    }>(
      `SELECT lesson_id AS "lessonId",
              MIN(recorded_at) FILTER (WHERE status = 'INTRODUCED')::date::text AS "firstIntroduced",
              COALESCE(
                MIN(recorded_at) FILTER (WHERE status = 'MASTERED')::date::text,
                MAX(recorded_at)::date::text
              ) AS "upperBound"
       FROM lesson_records
       WHERE student_id = $1
       GROUP BY lesson_id
       HAVING MIN(recorded_at) FILTER (WHERE status = 'INTRODUCED') IS NOT NULL`,
      [levinId],
    );

    let practiceExtrasAdded = 0;
    for (const l of practiceTargets) {
      const introMs = new Date(l.firstIntroduced + 'T00:00:00Z').getTime();
      const upperMs = new Date(l.upperBound + 'T00:00:00Z').getTime();
      const spanDays = Math.round((upperMs - introMs) / 86_400_000);
      if (spanDays < 8) continue; // Nicht genug Spielraum für mehrere Übungen.

      // 2–5 Übungseinheiten, deterministisch pro Lektion.
      const count = pickInRange(l.lessonId, 'practiceCount', 2, 5);
      for (let i = 0; i < count; i++) {
        // Gleichmässige Verteilung mit kleinem Jitter, damit nicht alle
        // Lektionen identisch gespacet aussehen.
        const baseT = (i + 1) / (count + 1); // 0..1 exklusiv der Ränder
        const jitter = lessonRand(l.lessonId, `practiceJ_${i}`) * 0.18 - 0.09;
        const t = Math.min(0.95, Math.max(0.05, baseT + jitter));
        const offsetDays = Math.max(1, Math.round(spanDays * t));
        const d = new Date(introMs);
        d.setUTCDate(d.getUTCDate() + offsetDays);
        const dateStr = d.toISOString().slice(0, 10);

        // Duplikat-Check auf exakt (lesson, date, status).
        const { rows: dup } = await c.query(
          `SELECT 1 FROM lesson_records
           WHERE student_id = $1 AND lesson_id = $2 AND recorded_at = $3
             AND status = 'PRACTICED'`,
          [levinId, l.lessonId, dateStr],
        );
        if (dup[0]) continue;

        await c.query(
          `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                student_id, lesson_id, recorded_at, status, organization_id, note)
           VALUES ($1, 1, true, false, now(), now(),
                $2, $3, $4::date, 'PRACTICED', $5, $6)`,
          [randomUUID(), levinId, l.lessonId, dateStr, ORG_ID, BACKFILL_NOTE],
        );
        practiceExtrasAdded++;
      }
    }
    console.log(
      `✓ Extra practice sessions for Levin (+${practiceExtrasAdded})`,
    );

    // -------- 9f. Fill Klasse-PA classmates with varied data --------
    // Für jeden aktiven Mitschüler in Klasse PA (ausser Levin selbst) wird
    // die komplette Lesson-Record-Pipeline durchlaufen: Profile-basierte
    // Status-Verteilung über die Top-Areas (9b-Logik), Backfill mit
    // varied Offsets (9c) und 2–5 Extra-PRACTICED-Sessions pro Lektion
    // (9e). Damit zeigt die Klassen-Heatmap echtes Klassen-Bild statt
    // einer einzelnen Datenzeile für Levin.
    //
    // Deterministisch: alle Random-Picks gehen über `lessonRand` mit
    // student-spezifischem Salt. Re-Runs erzeugen identische Daten,
    // der org-weite BACKFILL_NOTE-Cleanup oben ersetzt die alten Rows.
    // (PA_CLASS_NAME is declared once, top-level, near NEW_CLASSES.)
    const { rows: classmates } = await c.query<{
      id: string;
      firstName: string;
      lastName: string;
    }>(
      `SELECT s.id, s."firstName", s."lastName"
       FROM students s
       JOIN school_class_enrollments sce
         ON sce.student_id = s.id
        AND sce."isActive" = true
        AND sce.left_at IS NULL
       JOIN school_classes sc ON sc.id = sce.school_class_id
       WHERE sc.organization_id = $1
         AND sc.name = $2
         AND s.id <> $3
       ORDER BY s."lastName", s."firstName"`,
      [ORG_ID, PA_CLASS_NAME, levinId],
    );

    let classmateLessonsAdded = 0;
    let classmateBackfillAdded = 0;
    let classmatePracticeAdded = 0;

    for (let cmIdx = 0; cmIdx < classmates.length; cmIdx++) {
      const cm = classmates[cmIdx];
      const studentId = cm.id;
      // Rotation: jeder Schüler startet bei einem anderen Profile-Index,
      // damit die Klassen-Heatmap verschiedene Stärke-Muster zeigt.
      const profileShift = cmIdx;

      // ---- 9f.1 Status-Profile pro AREA (analog 9b) ----
      // baseDate wird per Schüler um ein paar Wochen verschoben, damit nicht
      // alle Mitschüler am selben Tag eingeführt wurden.
      const baseDate = new Date('2025-11-15');
      baseDate.setUTCDate(
        baseDate.getUTCDate() - pickInRange(studentId, 'baseShift', 0, 60),
      );
      let dayOffset = 0;

      for (let i = 0; i < rankedAreas.length; i++) {
        const area = rankedAreas[i];
        const profile = PROFILES[(i + profileShift) % PROFILES.length];

        const { rows: lessons } = await c.query<{ id: string }>(
          `WITH RECURSIVE descendants AS (
             SELECT id, parent_id, node_type, position
             FROM curriculum_nodes WHERE id = $1
           UNION ALL
             SELECT n.id, n.parent_id, n.node_type, n.position
             FROM curriculum_nodes n
             JOIN descendants d ON n.parent_id = d.id
           )
           SELECT d.id
           FROM descendants d
           WHERE d.node_type = 'LESSON'
             AND NOT EXISTS (
               SELECT 1 FROM lesson_records lr
               WHERE lr.student_id = $2 AND lr.lesson_id = d.id
             )
           ORDER BY d.position
           LIMIT $3`,
          [area.id, studentId, profile.lessons],
        );

        const seq: string[] = [];
        const mCount = Math.round(profile.mastered * lessons.length);
        const pCount = Math.round(profile.practiced * lessons.length);
        const iCount = Math.round(profile.introduced * lessons.length);
        const nmCount = Math.max(0, lessons.length - mCount - pCount - iCount);
        for (let k = 0; k < mCount; k++) seq.push('MASTERED');
        for (let k = 0; k < pCount; k++) seq.push('PRACTICED');
        for (let k = 0; k < iCount; k++) seq.push('INTRODUCED');
        for (let k = 0; k < nmCount; k++) seq.push('NEEDS_MORE');

        for (let j = 0; j < lessons.length; j++) {
          const status = seq[j] ?? 'INTRODUCED';
          const d = new Date(baseDate);
          d.setUTCDate(d.getUTCDate() + dayOffset++);
          const dateStr = d.toISOString().slice(0, 10);
          await c.query(
            `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                  student_id, lesson_id, recorded_at, status, organization_id)
             VALUES ($1, 1, true, false, now(), now(),
                  $2, $3, $4::date, $5::lesson_records_status_enum, $6)`,
            [randomUUID(), studentId, lessons[j].id, dateStr, status, ORG_ID],
          );
          classmateLessonsAdded++;
        }
      }

      // ---- 9f.2 Backfill INTRODUCED/PRACTICED (analog 9c) ----
      const { rows: cmStats } = await c.query<{
        lesson_id: string;
        earliest: string;
        top_status: string;
        has_introduced: boolean;
        has_practiced: boolean;
      }>(
        `SELECT lesson_id,
                MIN(recorded_at)::date::text AS earliest,
                CASE
                  WHEN bool_or(status = 'MASTERED')   THEN 'MASTERED'
                  WHEN bool_or(status = 'PRACTICED')  THEN 'PRACTICED'
                  WHEN bool_or(status = 'INTRODUCED') THEN 'INTRODUCED'
                  WHEN bool_or(status = 'NEEDS_MORE') THEN 'NEEDS_MORE'
                  ELSE 'PLANNING'
                END AS top_status,
                bool_or(status = 'INTRODUCED') AS has_introduced,
                bool_or(status = 'PRACTICED')  AS has_practiced
         FROM lesson_records
         WHERE student_id = $1
         GROUP BY lesson_id`,
        [studentId],
      );

      for (const s of cmStats) {
        const rank = STATUS_RANK[s.top_status] ?? 0;
        if (rank < 2) continue;
        const earliestDate = new Date(s.earliest + 'T00:00:00Z');
        const introOffset = -pickInRange(
          `${studentId}:${s.lesson_id}`,
          'intro',
          70,
          180,
        );
        const practicedOffset = -pickInRange(
          `${studentId}:${s.lesson_id}`,
          'practiced',
          15,
          60,
        );
        const inserts: { status: string; offsetDays: number }[] = [];
        if (!s.has_introduced) {
          inserts.push({ status: 'INTRODUCED', offsetDays: introOffset });
        }
        if (rank === 3 && !s.has_practiced) {
          inserts.push({ status: 'PRACTICED', offsetDays: practicedOffset });
        }
        for (const ins of inserts) {
          const d = new Date(earliestDate);
          d.setUTCDate(d.getUTCDate() + ins.offsetDays);
          const dateStr = d.toISOString().slice(0, 10);
          await c.query(
            `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                  student_id, lesson_id, recorded_at, status, organization_id, note)
             VALUES ($1, 1, true, false, now(), now(),
                  $2, $3, $4::date, $5::lesson_records_status_enum, $6, $7)`,
            [
              randomUUID(),
              studentId,
              s.lesson_id,
              dateStr,
              ins.status,
              ORG_ID,
              BACKFILL_NOTE,
            ],
          );
          classmateBackfillAdded++;
        }
      }

      // ---- 9f.3 Extra PRACTICED-Sessions (analog 9e) ----
      const { rows: cmTargets } = await c.query<{
        lessonId: string;
        firstIntroduced: string;
        upperBound: string;
      }>(
        `SELECT lesson_id AS "lessonId",
                MIN(recorded_at) FILTER (WHERE status = 'INTRODUCED')::date::text AS "firstIntroduced",
                COALESCE(
                  MIN(recorded_at) FILTER (WHERE status = 'MASTERED')::date::text,
                  MAX(recorded_at)::date::text
                ) AS "upperBound"
         FROM lesson_records
         WHERE student_id = $1
         GROUP BY lesson_id
         HAVING MIN(recorded_at) FILTER (WHERE status = 'INTRODUCED') IS NOT NULL`,
        [studentId],
      );

      for (const l of cmTargets) {
        const introMs = new Date(l.firstIntroduced + 'T00:00:00Z').getTime();
        const upperMs = new Date(l.upperBound + 'T00:00:00Z').getTime();
        const spanDays = Math.round((upperMs - introMs) / 86_400_000);
        if (spanDays < 8) continue;
        const count = pickInRange(
          `${studentId}:${l.lessonId}`,
          'practiceCount',
          2,
          5,
        );
        for (let i = 0; i < count; i++) {
          const baseT = (i + 1) / (count + 1);
          const jitter =
            lessonRand(`${studentId}:${l.lessonId}`, `practiceJ_${i}`) * 0.18 -
            0.09;
          const t = Math.min(0.95, Math.max(0.05, baseT + jitter));
          const offsetDays = Math.max(1, Math.round(spanDays * t));
          const d = new Date(introMs);
          d.setUTCDate(d.getUTCDate() + offsetDays);
          const dateStr = d.toISOString().slice(0, 10);
          const { rows: dup } = await c.query(
            `SELECT 1 FROM lesson_records
             WHERE student_id = $1 AND lesson_id = $2 AND recorded_at = $3
               AND status = 'PRACTICED'`,
            [studentId, l.lessonId, dateStr],
          );
          if (dup[0]) continue;
          await c.query(
            `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                  student_id, lesson_id, recorded_at, status, organization_id, note)
             VALUES ($1, 1, true, false, now(), now(),
                  $2, $3, $4::date, 'PRACTICED', $5, $6)`,
            [
              randomUUID(),
              studentId,
              l.lessonId,
              dateStr,
              ORG_ID,
              BACKFILL_NOTE,
            ],
          );
          classmatePracticeAdded++;
        }
      }
    }

    console.log(
      `✓ Klasse-PA classmates filled (${classmates.length} students): ` +
        `+${classmateLessonsAdded} base records, ` +
        `+${classmateBackfillAdded} backfills, ` +
        `+${classmatePracticeAdded} practice sessions`,
    );

    // -------- 9g. Beobachtungs-Achsen (Hattie/Montessori) -----------------
    // Befüllt engagement, difficulty, socialForm, selfAssessment,
    // persistence, concentration, selfConfidence auf allen Klasse-PA-
    // Records deterministisch via md5(record_id || axis).
    //
    // - Idempotent: gleiche Werte bei jedem Run.
    // - Realistische Lücken: nicht jede Achse ist auf jedem Record gesetzt
    //   (Lehrer:innen tracken in echt selten alle 7 Felder).
    // - Engagement bekommt einen leichten saisonalen Knick (Winterloch +
    //   Pre-Sommer-Dip) damit der Klassen-Verlauf nicht flach aussieht.
    //
    // SQL-Pattern: `get_byte(decode(md5(id::text || 'salt'), 'hex'), 0)`
    // liefert pro Record einen deterministischen 0..255-Wert; mod 100 mappt
    // auf Perzentil-Schwellen.
    const paStudentIdRows = await c.query<{ id: string }>(
      `SELECT s.id
         FROM students s
         JOIN school_class_enrollments sce
           ON sce.student_id = s.id
          AND sce."isActive" = true
          AND sce.left_at IS NULL
         JOIN school_classes sc ON sc.id = sce.school_class_id
        WHERE sc.organization_id = $1
          AND sc.name = $2`,
      [ORG_ID, PA_CLASS_NAME],
    );
    const paStudentIds = paStudentIdRows.rows.map((r) => r.id);

    if (paStudentIds.length > 0) {
      const SEED_NOTE_OBS = '__seed_obs__';

      // 9g.1 engagement (~80% coverage, positiv-geneigt, mit Saison-Knick)
      // Buckets 0..79 sind nicht-null (20% bleibt NULL = 80% coverage).
      // Saisonfaktor: Winterloch (KW 5..10) und Sommerdip (KW 25..29)
      // drücken den Score nach unten → mehr MECHANICAL/RESISTANT.
      // Verteilung ohne Saison (bucket 0..79):
      //   0..6   →  7%  RESISTANT
      //   7..24  → 18%  MECHANICAL
      //   25..54 → 30%  INTERESTED
      //   55..79 → 25%  FOCUSED
      const engagementUpdate = await c.query(
        `UPDATE lesson_records lr
            SET engagement = CASE
              WHEN bucket >= 80 THEN NULL
              WHEN (bucket + season) <  7 THEN 'RESISTANT'::lesson_records_engagement_enum
              WHEN (bucket + season) < 25 THEN 'MECHANICAL'::lesson_records_engagement_enum
              WHEN (bucket + season) < 55 THEN 'INTERESTED'::lesson_records_engagement_enum
              ELSE                              'FOCUSED'::lesson_records_engagement_enum
            END
           FROM (
             SELECT id,
                    get_byte(decode(md5(id::text || 'engagement'), 'hex'), 0) % 100 AS bucket,
                    CASE
                      WHEN EXTRACT(WEEK FROM recorded_at)::int BETWEEN 5 AND 10 THEN -10
                      WHEN EXTRACT(WEEK FROM recorded_at)::int BETWEEN 25 AND 29 THEN -15
                      WHEN EXTRACT(WEEK FROM recorded_at)::int BETWEEN 36 AND 45 THEN  8
                      ELSE 0
                    END AS season
               FROM lesson_records
              WHERE organization_id = $1
                AND student_id = ANY($2::uuid[])
           ) s
          WHERE lr.id = s.id`,
        [ORG_ID, paStudentIds],
      );

      // 9g.2 difficulty (~65% coverage, JUST_RIGHT-Mehrheit = Montessori-Ideal)
      const difficultyUpdate = await c.query(
        `UPDATE lesson_records lr
            SET difficulty = CASE
              WHEN bucket >= 65 THEN NULL
              WHEN bucket < 10 THEN 'TOO_HARD'::lesson_records_difficulty_enum
              WHEN bucket < 26 THEN 'TOO_EASY'::lesson_records_difficulty_enum
              ELSE                 'JUST_RIGHT'::lesson_records_difficulty_enum
            END
           FROM (
             SELECT id,
                    get_byte(decode(md5(id::text || 'difficulty'), 'hex'), 0) % 100 AS bucket
               FROM lesson_records
              WHERE organization_id = $1
                AND student_id = ANY($2::uuid[])
           ) s
          WHERE lr.id = s.id`,
        [ORG_ID, paStudentIds],
      );

      // 9g.3 socialForm (~55% coverage, ALONE-heavy)
      const socialUpdate = await c.query(
        `UPDATE lesson_records lr
            SET social_form = CASE
              WHEN bucket >= 55 THEN NULL
              WHEN bucket <  4 THEN 'WITH_GUIDE'::lesson_records_social_form_enum
              WHEN bucket < 13 THEN 'SMALL_GROUP'::lesson_records_social_form_enum
              WHEN bucket < 29 THEN 'WITH_PARTNER'::lesson_records_social_form_enum
              ELSE                 'ALONE'::lesson_records_social_form_enum
            END
           FROM (
             SELECT id,
                    get_byte(decode(md5(id::text || 'socialForm'), 'hex'), 0) % 100 AS bucket
               FROM lesson_records
              WHERE organization_id = $1
                AND student_id = ANY($2::uuid[])
           ) s
          WHERE lr.id = s.id`,
        [ORG_ID, paStudentIds],
      );

      // 9g.4 selfAssessment (~32% coverage, UNDERSTOOD-Mehrheit)
      const selfAssessmentUpdate = await c.query(
        `UPDATE lesson_records lr
            SET self_assessment = CASE
              WHEN bucket >= 32 THEN NULL
              WHEN bucket <  3 THEN 'NEEDS_REPEAT'::lesson_records_self_assessment_enum
              WHEN bucket <  9 THEN 'PARTIAL'::lesson_records_self_assessment_enum
              ELSE                 'UNDERSTOOD'::lesson_records_self_assessment_enum
            END
           FROM (
             SELECT id,
                    get_byte(decode(md5(id::text || 'selfAssessment'), 'hex'), 0) % 100 AS bucket
               FROM lesson_records
              WHERE organization_id = $1
                AND student_id = ANY($2::uuid[])
           ) s
          WHERE lr.id = s.id`,
        [ORG_ID, paStudentIds],
      );

      // 9g.5 persistence (~58% coverage, PERSISTS-Mehrheit)
      const persistenceUpdate = await c.query(
        `UPDATE lesson_records lr
            SET persistence = CASE
              WHEN bucket >= 58 THEN NULL
              WHEN bucket <  5 THEN 'GIVES_UP'::lesson_records_persistence_enum
              WHEN bucket < 17 THEN 'SEEKS_HELP'::lesson_records_persistence_enum
              ELSE                 'PERSISTS'::lesson_records_persistence_enum
            END
           FROM (
             SELECT id,
                    get_byte(decode(md5(id::text || 'persistence'), 'hex'), 0) % 100 AS bucket
               FROM lesson_records
              WHERE organization_id = $1
                AND student_id = ANY($2::uuid[])
           ) s
          WHERE lr.id = s.id`,
        [ORG_ID, paStudentIds],
      );

      // 9g.6 concentration (~62% coverage, FLOW-Mehrheit)
      const concentrationUpdate = await c.query(
        `UPDATE lesson_records lr
            SET concentration = CASE
              WHEN bucket >= 62 THEN NULL
              WHEN bucket <  8 THEN 'INTERRUPTED'::lesson_records_concentration_enum
              WHEN bucket < 24 THEN 'PARTIAL_FOCUS'::lesson_records_concentration_enum
              ELSE                 'FLOW'::lesson_records_concentration_enum
            END
           FROM (
             SELECT id,
                    get_byte(decode(md5(id::text || 'concentration'), 'hex'), 0) % 100 AS bucket
               FROM lesson_records
              WHERE organization_id = $1
                AND student_id = ANY($2::uuid[])
           ) s
          WHERE lr.id = s.id`,
        [ORG_ID, paStudentIds],
      );

      // 9g.7 selfConfidence (~48% coverage, CONFIDENT-Mehrheit)
      const selfConfidenceUpdate = await c.query(
        `UPDATE lesson_records lr
            SET self_confidence = CASE
              WHEN bucket >= 48 THEN NULL
              WHEN bucket <  4 THEN 'INSECURE'::lesson_records_self_confidence_enum
              WHEN bucket < 16 THEN 'TENTATIVE'::lesson_records_self_confidence_enum
              ELSE                 'CONFIDENT'::lesson_records_self_confidence_enum
            END
           FROM (
             SELECT id,
                    get_byte(decode(md5(id::text || 'selfConfidence'), 'hex'), 0) % 100 AS bucket
               FROM lesson_records
              WHERE organization_id = $1
                AND student_id = ANY($2::uuid[])
           ) s
          WHERE lr.id = s.id`,
        [ORG_ID, paStudentIds],
      );

      // Marker für Stichprobe — etwa jeder 10. Record bekommt eine kurze
      // Notiz, damit die Notes-Timeline im Aktivitäts-Tab nicht leer ist.
      const NOTES = [
        'Sehr konzentriert gearbeitet.',
        'Hat heute eigenständig Material ausgewählt.',
        'Brauchte am Anfang Unterstützung, dann selbständig.',
        'Mehrmals abgelenkt, aber zurückgekehrt.',
        'Hat einem anderen Kind die Übung erklärt.',
        'Sichtlich frustriert — Material zu früh.',
        'Tiefe Polarisation der Aufmerksamkeit.',
        'Heute wenig Energie — kurze Sequenz.',
        'Wiederholung hat geholfen.',
        'Sehr stolz nach Abschluss.',
      ];
      const notesUpdate = await c.query<{ id: string; idx: number }>(
        `SELECT id,
                get_byte(decode(md5(id::text || 'noteIdx'), 'hex'), 0) % ${NOTES.length} AS idx
           FROM lesson_records
          WHERE organization_id = $1
            AND student_id = ANY($2::uuid[])
            AND note IS NULL
            AND get_byte(decode(md5(id::text || 'noteFlag'), 'hex'), 0) % 100 < 12`,
        [ORG_ID, paStudentIds],
      );
      for (const row of notesUpdate.rows) {
        await c.query(`UPDATE lesson_records SET note = $1 WHERE id = $2`, [
          `${SEED_NOTE_OBS} ${NOTES[Number(row.idx)]}`,
          row.id,
        ]);
      }

      // 9g.8 Frische Records der letzten 6 Wochen — pro Schüler 3..7 neue
      // Einträge pro Woche mit gemischtem Status, damit der 30-Tage-Chart
      // nicht leer aussieht. Lektionen werden nur ausgewählt, wenn der
      // Schüler sie noch nicht erfasst hat. Tag wird deterministisch aus
      // student_id × Wochen-Index berechnet → idempotent.
      const RECENT_NOTE = '__seed_recent__';
      // Stale recent records erst entfernen, damit re-runs frische Daten
      // gegen das aktuelle CURRENT_DATE erzeugen.
      await c.query(
        `DELETE FROM lesson_records WHERE organization_id = $1 AND note = $2`,
        [ORG_ID, RECENT_NOTE],
      );

      // Status-Mix: 25% INTRODUCED, 45% PRACTICED, 20% MASTERED, 10% NEEDS_MORE
      const recentStatus = (rand: number): string => {
        if (rand < 25) return 'INTRODUCED';
        if (rand < 70) return 'PRACTICED';
        if (rand < 90) return 'MASTERED';
        return 'NEEDS_MORE';
      };
      // Engagement-Mix für die frischen Records (eigene Verteilung,
      // unabhängig vom 9g.1 SQL-CASE — wir setzen den Wert direkt beim
      // INSERT, damit auch die letzten 30 Tage echte Engagement-Daten haben).
      const recentEngagement = (rand: number): string => {
        if (rand < 25) return 'FOCUSED';
        if (rand < 60) return 'INTERESTED';
        if (rand < 85) return 'MECHANICAL';
        return 'RESISTANT';
      };

      let recentAdded = 0;
      for (const studentId of paStudentIds) {
        // Pool: alle LESSON-Knoten der Org, die der Schüler noch NICHT erfasst hat.
        const { rows: freshLessons } = await c.query<{ id: string }>(
          `SELECT n.id
             FROM curriculum_nodes n
            WHERE n.organization_id = $1
              AND n.node_type = 'LESSON'
              AND NOT EXISTS (
                SELECT 1 FROM lesson_records lr
                 WHERE lr.student_id = $2 AND lr.lesson_id = n.id
              )
            ORDER BY n.position
            LIMIT 60`,
          [ORG_ID, studentId],
        );
        if (freshLessons.length === 0) continue;

        let lessonIdx = 0;
        // 6 Wochen × pro Woche 3..7 Records
        for (let week = 0; week < 6; week++) {
          const perWeek = pickInRange(`${studentId}:${week}`, 'recCount', 3, 7);
          for (let i = 0; i < perWeek; i++) {
            if (lessonIdx >= freshLessons.length) break;
            const lessonId = freshLessons[lessonIdx++].id;

            // Datum: 0..6 Tage innerhalb der Woche, deterministisch
            const daysAgo =
              week * 7 +
              pickInRange(`${studentId}:${week}:${i}`, 'dayInWeek', 0, 6);
            const d = new Date();
            d.setUTCHours(0, 0, 0, 0);
            d.setUTCDate(d.getUTCDate() - daysAgo);
            const dateStr = d.toISOString().slice(0, 10);

            const statusBucket = pickInRange(
              `${studentId}:${lessonId}`,
              'recStatus',
              0,
              99,
            );
            const engagementBucket = pickInRange(
              `${studentId}:${lessonId}`,
              'recEng',
              0,
              99,
            );
            const status = recentStatus(statusBucket);
            const engagement = recentEngagement(engagementBucket);

            await c.query(
              `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                    student_id, lesson_id, recorded_at, status, organization_id, note, engagement)
               VALUES ($1, 1, true, false, now(), now(),
                    $2, $3, $4::date, $5::lesson_records_status_enum,
                    $6, $7, $8::lesson_records_engagement_enum)`,
              [
                randomUUID(),
                studentId,
                lessonId,
                dateStr,
                status,
                ORG_ID,
                RECENT_NOTE,
                engagement,
              ],
            );
            recentAdded++;
          }
        }
      }

      console.log(
        `✓ Recent (last 6 weeks) records for Klasse-PA: +${recentAdded}`,
      );

      console.log(
        `✓ Observation axes seeded for Klasse-PA: ` +
          `engagement +${engagementUpdate.rowCount}, ` +
          `difficulty +${difficultyUpdate.rowCount}, ` +
          `social +${socialUpdate.rowCount}, ` +
          `selfAssessment +${selfAssessmentUpdate.rowCount}, ` +
          `persistence +${persistenceUpdate.rowCount}, ` +
          `concentration +${concentrationUpdate.rowCount}, ` +
          `selfConfidence +${selfConfidenceUpdate.rowCount}, ` +
          `notes +${notesUpdate.rowCount}`,
      );
    }
  }

  // -------- Admission pipeline (Families + ContactPersons + Applications) --
  // Map stage slug -> id once.
  const { rows: stageRows } = await c.query<{ id: string; slug: string }>(
    `SELECT id, slug FROM admission_stages WHERE organization_id = $1`,
    [ORG_ID],
  );
  const stageBySlug = new Map(stageRows.map((r) => [r.slug, r.id]));

  // Detect Postgres enum type names at runtime — TypeORM auto-names enums on
  // `synchronize`, while our migration uses explicit names; reading from
  // information_schema works in both environments.
  const findEnum = async (
    table: string,
    column: string,
  ): Promise<string | null> => {
    const { rows } = await c.query<{ udt_name: string }>(
      `SELECT udt_name FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2`,
      [table, column],
    );
    // Array columns are reported as `_enumname` — strip the leading underscore.
    return rows[0]?.udt_name?.replace(/^_/, '') ?? null;
  };
  const rolesEnumType = await findEnum('contact_persons', 'roles');
  const appStatusEnum = await findEnum('admission_applications', 'status');
  const appSourceEnum = await findEnum('admission_applications', 'source');
  const appGenderEnum = await findEnum(
    'admission_applications',
    'child_gender',
  );
  if (!appStatusEnum || !appSourceEnum || !appGenderEnum) {
    console.warn(
      '  ! admission_applications enum types not found — make sure the backend has run once with the new entities.',
    );
  }

  // Map birth-year to a desired grade level for the seeded applications. The
  // Testschule org has different grade-level names than a default install, so
  // we resolve each by name (Kindergarten / Unterstufe / Mittelstufe /
  // Oberstufe — or fall back to the org-specific Vorschule / Primarstufe).
  const { rows: gradeLevelRows } = await c.query<{ id: string; name: string }>(
    `SELECT id, name FROM grade_levels WHERE organization_id = $1 AND "isArchived" = false`,
    [ORG_ID],
  );
  const gradeLevelByName = new Map(gradeLevelRows.map((g) => [g.name, g.id]));
  const findGradeLevelId = (preferred: string[]): string | null => {
    for (const name of preferred) {
      const id = gradeLevelByName.get(name);
      if (id) return id;
    }
    return null;
  };
  const gradeLevelForBirthYear = (yyyy: number): string | null => {
    const age = new Date().getFullYear() - yyyy;
    if (age <= 4) return findGradeLevelId(['Vorschule', 'Kindergarten']);
    if (age <= 6) return findGradeLevelId(['Kindergarten', 'Vorschule']);
    if (age <= 9) return findGradeLevelId(['Unterstufe', 'Primarstufe']);
    if (age <= 12) return findGradeLevelId(['Mittelstufe', 'Primarstufe']);
    return findGradeLevelId(['Oberstufe']);
  };

  let familiesCreated = 0;
  let parentsCreated = 0;
  let applicationsCreated = 0;
  // Track per-stage position so seeded cards keep a sensible order.
  const stagePositions: Record<string, number> = {};

  for (const fam of APPLICANT_FAMILIES) {
    // Family — idempotent by (org, name)
    let familyId: string;
    const { rows: famRows } = await c.query<{ id: string }>(
      `SELECT id FROM families WHERE organization_id = $1 AND name = $2`,
      [ORG_ID, fam.familyName],
    );
    if (famRows[0]) {
      familyId = famRows[0].id;
    } else {
      familyId = randomUUID();
      await c.query(
        `INSERT INTO families (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              name, organization_id)
         VALUES ($1, 1, true, false, now(), now(), $2, $3)`,
        [familyId, fam.familyName, ORG_ID],
      );
      familiesCreated++;
    }

    // Parents — idempotent by (family_id, first_name, last_name)
    for (const p of fam.parents) {
      const { rows: existingP } = await c.query<{ id: string }>(
        `SELECT id FROM contact_persons
           WHERE organization_id = $1 AND family_id = $2
             AND first_name = $3 AND last_name = $4`,
        [ORG_ID, familyId, p.firstName, p.lastName],
      );
      if (existingP[0]) continue;
      const cpId = randomUUID();
      await c.query(
        `INSERT INTO contact_persons
           (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            salutation, first_name, last_name, email, phone, occupation,
            family_id, organization_id)
         VALUES ($1, 1, true, false, now(), now(),
            $2, $3, $4, $5, $6, $7,
            $8, $9)`,
        [
          cpId,
          p.salutation,
          p.firstName,
          p.lastName,
          p.email ?? null,
          p.phone ?? null,
          p.occupation ?? null,
          familyId,
          ORG_ID,
        ],
      );
      // Populate the roles array (only if the enum type was detected).
      if (rolesEnumType) {
        await c.query(
          `UPDATE contact_persons SET roles = ARRAY[$1]::${rolesEnumType}[] WHERE id = $2`,
          [p.relationship, cpId],
        );
      }
      parentsCreated++;
    }

    // Applications (one per child)
    for (const child of fam.children) {
      const stageId = stageBySlug.get(child.stage);
      if (!stageId) {
        console.warn(
          `  · Stage "${child.stage}" not found for ${child.firstName} ${child.lastName} — skipping`,
        );
        continue;
      }

      const { rows: existingApp } = await c.query<{ id: string }>(
        `SELECT id FROM admission_applications
           WHERE organization_id = $1 AND family_id = $2
             AND child_first_name = $3 AND child_last_name = $4`,
        [ORG_ID, familyId, child.firstName, child.lastName],
      );
      if (existingApp[0]) continue;

      const position = stagePositions[stageId] ?? 0;
      stagePositions[stageId] = position + 1;

      const days = child.daysInStage ?? 0;
      const stageEnteredAt = new Date(Date.now() - days * 86_400_000);
      const status = child.stage === 'abgelehnt' ? 'REJECTED' : 'ACTIVE';

      const birthYear = Number(child.dateOfBirth.slice(0, 4));
      const gradeLevelId = Number.isFinite(birthYear)
        ? gradeLevelForBirthYear(birthYear)
        : null;
      await c.query(
        `INSERT INTO admission_applications
           (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            organization_id, family_id, admission_stage_id,
            child_first_name, child_last_name, child_date_of_birth, child_gender,
            child_notes, status, source, stage_entered_at, position,
            assigned_grade_level_id)
         VALUES ($1, 1, true, false, $9::timestamptz, $9::timestamptz,
            $2, $3, $4,
            $5, $6, $7::date, $8::${appGenderEnum},
            $10, $11::${appStatusEnum}, $12::${appSourceEnum},
            $9::timestamptz, $13,
            $14)`,
        [
          randomUUID(),
          ORG_ID,
          familyId,
          stageId,
          child.firstName,
          child.lastName,
          child.dateOfBirth,
          child.gender,
          stageEnteredAt.toISOString(),
          child.notes ?? null,
          status,
          child.source ?? 'MANUAL',
          position,
          gradeLevelId,
        ],
      );
      applicationsCreated++;
    }
  }
  console.log(
    `✓ Admission pipeline: families +${familiesCreated}, parents +${parentsCreated}, applications +${applicationsCreated}`,
  );

  // Backfill assigned_grade_level_id for existing rows that are still NULL.
  // The mapping mirrors `gradeLevelForBirthYear` above and is safe to re-run.
  // pg returns DATE columns as `Date` objects — coerce explicitly to YYYY-MM-DD.
  let backfilled = 0;
  const { rows: missing } = await c.query<{
    id: string;
    child_date_of_birth: Date | string | null;
  }>(
    `SELECT id, child_date_of_birth FROM admission_applications
      WHERE organization_id = $1 AND assigned_grade_level_id IS NULL`,
    [ORG_ID],
  );
  for (const row of missing) {
    if (!row.child_date_of_birth) continue;
    const iso =
      row.child_date_of_birth instanceof Date
        ? row.child_date_of_birth.toISOString().slice(0, 10)
        : String(row.child_date_of_birth).slice(0, 10);
    const year = Number(iso.slice(0, 4));
    if (!Number.isFinite(year)) continue;
    const gradeLevelId = gradeLevelForBirthYear(year);
    if (!gradeLevelId) continue;
    await c.query(
      `UPDATE admission_applications SET assigned_grade_level_id = $1 WHERE id = $2`,
      [gradeLevelId, row.id],
    );
    backfilled++;
  }
  if (backfilled > 0) {
    console.log(
      `✓ Admission applications: grade-level backfilled (+${backfilled})`,
    );
  }

  // -------- Admission → enrollment: finalize "Vertrag"-stage applicants ----
  // Children whose application already sits at the "Vertrag" (contract)
  // stage are realistic candidates to already be enrolled — contract signed,
  // just needs a class assignment. Finalizing them via the real
  // AdmissionApplicationsService exercises the exact same enrollment path as
  // the Klasse-PA roster above, just triggered from application data instead
  // of a fixed roster, and spreads students across the other seeded classes
  // (not just Klasse PA) so class rosters outside the Hattie-demo class are
  // non-empty too.
  {
    const { rows: vertragStage } = await c.query<{ id: string }>(
      `SELECT id FROM admission_stages WHERE organization_id = $1 AND slug = 'vertrag' LIMIT 1`,
      [ORG_ID],
    );
    const { rows: otherClasses } = await c.query<{
      id: string;
      name: string;
    }>(
      `SELECT id, name FROM school_classes
        WHERE organization_id = $1 AND name <> $2
        ORDER BY name`,
      [ORG_ID, PA_CLASS_NAME],
    );
    if (vertragStage[0] && otherClasses.length > 0) {
      const { rows: vertragApps } = await c.query<{
        id: string;
        child_first_name: string;
        child_last_name: string;
      }>(
        `SELECT id, child_first_name, child_last_name FROM admission_applications
          WHERE organization_id = $1 AND admission_stage_id = $2 AND status = 'ACTIVE'
          ORDER BY child_last_name, child_first_name`,
        [ORG_ID, vertragStage[0].id],
      );
      let vertragEnrolled = 0;
      for (let i = 0; i < vertragApps.length; i++) {
        const app = vertragApps[i];
        const targetClass = otherClasses[i % otherClasses.length];
        try {
          await admissionsService.finalizeEnrollment(
            {
              applicationId: app.id,
              schoolClassId: targetClass.id,
              enrollmentDate: '2025-08-18',
            },
            ORG_ID,
            null,
          );
          vertragEnrolled++;
        } catch (err) {
          // Already enrolled on a prior run (finalizeEnrollment rejects a
          // second call for the same application) — expected on re-runs.
          const message = err instanceof Error ? err.message : String(err);
          if (!message.includes('already marked as enrolled')) throw err;
        }
      }
      console.log(
        `✓ Vertrag-stage applicants finalized to enrollment (+${vertragEnrolled})`,
      );
    }
  }

  // -------- N. System Absenzkategorien (seed + Translations) --------
  await ensureSystemAbsenceCategories(c, ORG_ID);

  // -------- L. Large-school extension (classes, 250 students, 50 staff,
  //              lesson records, notes, admissions 2026/27, HR, protocols) --
  await seedLargeSchool(c, ORG_ID, admissionsService, pwHash);

  // -------- 10. Employee-management: contracts, vacations, absences, teams,
  //              time tracking --------
  await seedEmployeeManagement(c, ORG_ID);

  // -------- 11. Project management: projects, members, tasks, protocol -----
  await seedProjectManagement(c, ORG_ID);

  // -------- 12. Chats: conversations + messages --------------------------
  await seedChats(c, ORG_ID);

  await c.end();
  await app.close();
  const pwHint = PW_PLAIN === 'test1234' ? PW_PLAIN : '(SEED_USER_PASSWORD)';
  console.log(`\n✨ Done. Login with any of these (password: ${pwHint}):`);
  USERS.forEach((u) =>
    console.log(`   ${u.email}  →  ${u.persona} / ${u.roleCode}`),
  );
}

/**
 * Stellt die 9 System-Absenzkategorien der Testschule sicher und synct
 * DE/FR/IT/EN-Translations auf die Code-Defaults. Entfernt zusaetzlich
 * Custom-Kategorien aus E2E-Laeufen (Name beginnt mit "E2E "), sofern sie
 * von keiner Absenz referenziert werden.
 *
 * Quelle: apps/backend/src/employee-management/employee-absence-categories/
 *   seeds/system-employee-absence-categories.ts
 */
async function ensureSystemAbsenceCategories(c: Client, ORG_ID: string) {
  type T = { name: string; description: string | null };
  type CatDef = {
    code: string;
    countsAsWorkTime: boolean;
    isPaid: boolean;
    affectsVacationBalance: boolean;
    defaultIsVacationCapable: boolean;
    reducesVacationEntitlementAfterDays: number | null;
    requiresCertificate: boolean;
    certificateRequiredFromDay: number | null;
    maxDaysPerYear: number | null;
    defaultPercentage: number;
    requiresApproval: boolean;
    color: string;
    iconName: string;
    sortOrder: number;
    translations: { DE: T; FR: T; IT: T; EN: T };
  };

  const CATS: CatDef[] = [
    {
      code: 'SICKNESS',
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: 30,
      requiresCertificate: true,
      certificateRequiredFromDay: 3,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      color: '#EF4444',
      iconName: 'thermometer',
      sortOrder: 10,
      translations: {
        DE: {
          name: 'Krankheit',
          description:
            'Ab dem 3. Tag ist ein Arztzeugnis erforderlich (Schweizer Standard).',
        },
        FR: {
          name: 'Maladie',
          description:
            'Certificat médical requis dès le 3e jour (standard suisse).',
        },
        IT: {
          name: 'Malattia',
          description:
            'Certificato medico richiesto dal 3° giorno (standard svizzero).',
        },
        EN: {
          name: 'Sick leave',
          description:
            'Medical certificate required from day 3 (Swiss standard).',
        },
      },
    },
    {
      code: 'ACCIDENT',
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: 30,
      requiresCertificate: true,
      certificateRequiredFromDay: 1,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      color: '#F97316',
      iconName: 'heart-pulse',
      sortOrder: 20,
      translations: {
        DE: {
          name: 'Unfall',
          description:
            'Unfallmeldung erforderlich; Lohnfortzahlung gemäss UVG.',
        },
        FR: {
          name: 'Accident',
          description:
            'Déclaration d’accident requise; maintien du salaire selon la LAA.',
        },
        IT: {
          name: 'Infortunio',
          description:
            'Notifica d’infortunio richiesta; salario garantito secondo la LAINF.',
        },
        EN: {
          name: 'Accident',
          description:
            'Accident report required; salary continuation per Swiss accident insurance (UVG/LAA/LAINF).',
        },
      },
    },
    {
      code: 'CHILDCARE_SICK',
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: 3,
      defaultPercentage: 100,
      requiresApproval: false,
      color: '#F59E0B',
      iconName: 'baby',
      sortOrder: 30,
      translations: {
        DE: {
          name: 'Kind krank',
          description:
            'Betreuung kranker Kinder: max. 3 Tage pro Ereignis (Art. 36 ArG).',
        },
        FR: {
          name: 'Enfant malade',
          description:
            'Soins à un enfant malade: max. 3 jours par évènement (art. 36 LTr).',
        },
        IT: {
          name: 'Figlio malato',
          description:
            'Assistenza a un figlio malato: max. 3 giorni per evento (art. 36 LL).',
        },
        EN: {
          name: 'Sick child care',
          description:
            'Care for a sick child: max. 3 days per event (Swiss Labor Act art. 36).',
        },
      },
    },
    {
      code: 'TRAINING',
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      color: '#3B82F6',
      iconName: 'graduation-cap',
      sortOrder: 40,
      translations: {
        DE: {
          name: 'Weiterbildung',
          description: 'Externe oder interne berufliche Weiterbildung.',
        },
        FR: {
          name: 'Formation continue',
          description: 'Formation continue interne ou externe.',
        },
        IT: {
          name: 'Formazione continua',
          description: 'Formazione continua interna o esterna.',
        },
        EN: {
          name: 'Training',
          description: 'Internal or external professional training.',
        },
      },
    },
    {
      code: 'FUNERAL',
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: 3,
      defaultPercentage: 100,
      requiresApproval: false,
      color: '#6B7280',
      iconName: 'flower',
      sortOrder: 50,
      translations: {
        DE: {
          name: 'Trauerfall',
          description:
            'Todesfall in der nahen Familie; bis zu 3 Tage bezahlte Absenz.',
        },
        FR: {
          name: 'Décès',
          description:
            'Décès d’un proche; jusqu’à 3 jours d’absence rémunérée.',
        },
        IT: {
          name: 'Lutto',
          description:
            'Decesso di un familiare prossimo; fino a 3 giorni di assenza retribuita.',
        },
        EN: {
          name: 'Bereavement',
          description:
            'Death of a close family member; up to 3 days of paid leave.',
        },
      },
    },
    {
      code: 'MOVE',
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: 1,
      defaultPercentage: 100,
      requiresApproval: false,
      color: '#8B5CF6',
      iconName: 'truck',
      sortOrder: 60,
      translations: {
        DE: {
          name: 'Umzug',
          description: 'Tag des Wohnungsumzugs; 1 bezahlter Tag pro Jahr.',
        },
        FR: {
          name: 'Déménagement',
          description: 'Jour de déménagement; 1 jour rémunéré par an.',
        },
        IT: {
          name: 'Trasloco',
          description: 'Giorno del trasloco; 1 giorno retribuito all’anno.',
        },
        EN: {
          name: 'Moving day',
          description: 'Day of residential move; 1 paid day per year.',
        },
      },
    },
    {
      code: 'MILITARY_SERVICE',
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: true,
      certificateRequiredFromDay: 1,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      color: '#10B981',
      iconName: 'shield',
      sortOrder: 70,
      translations: {
        DE: {
          name: 'Militärdienst',
          description:
            'Obligatorische Dienstpflicht; Lohnfortzahlung via Erwerbsersatzordnung (EO).',
        },
        FR: {
          name: 'Service militaire',
          description:
            'Service militaire obligatoire; compensation via les Allocations pour perte de gain (APG).',
        },
        IT: {
          name: 'Servizio militare',
          description:
            'Servizio militare obbligatorio; indennità tramite l’Indennità di perdita di guadagno (IPG).',
        },
        EN: {
          name: 'Military service',
          description:
            'Mandatory Swiss military service; income compensation via EO/APG/IPG.',
        },
      },
    },
    {
      code: 'CIVIL_SERVICE',
      countsAsWorkTime: true,
      isPaid: true,
      affectsVacationBalance: false,
      defaultIsVacationCapable: false,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: true,
      certificateRequiredFromDay: 1,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: false,
      color: '#14B8A6',
      iconName: 'shield-check',
      sortOrder: 80,
      translations: {
        DE: {
          name: 'Zivildienst',
          description:
            'Ersatzdienst statt Militärdienst; Lohnfortzahlung via EO.',
        },
        FR: {
          name: 'Service civil',
          description:
            'Service civil en remplacement du service militaire; compensation via APG.',
        },
        IT: {
          name: 'Servizio civile',
          description:
            'Servizio civile in sostituzione del servizio militare; indennità tramite IPG.',
        },
        EN: {
          name: 'Civil service',
          description:
            'Civil service in lieu of military duty; income compensation via EO/APG/IPG.',
        },
      },
    },
    {
      code: 'OTHER',
      countsAsWorkTime: false,
      isPaid: false,
      affectsVacationBalance: false,
      defaultIsVacationCapable: true,
      reducesVacationEntitlementAfterDays: null,
      requiresCertificate: false,
      certificateRequiredFromDay: null,
      maxDaysPerYear: null,
      defaultPercentage: 100,
      requiresApproval: true,
      color: '#9CA3AF',
      iconName: 'help-circle',
      sortOrder: 999,
      translations: {
        DE: {
          name: 'Sonstiges',
          description:
            'Andere bezahlte oder unbezahlte Abwesenheit; Genehmigung erforderlich.',
        },
        FR: {
          name: 'Autre',
          description:
            'Autre absence rémunérée ou non rémunérée; approbation requise.',
        },
        IT: {
          name: 'Altro',
          description:
            'Altra assenza retribuita o non retribuita; approvazione richiesta.',
        },
        EN: {
          name: 'Other',
          description: 'Other paid or unpaid absence; requires approval.',
        },
      },
    },
  ];

  // E2E-Leftovers entfernen (nur wenn keine Absenz darauf zeigt)
  const e2eDeleted = await c.query(
    `WITH e2e AS (
       SELECT c.id
       FROM employee_absence_categories c
       JOIN employee_absence_category_translations t
         ON t.category_id = c.id AND t.locale = 'DE'
       WHERE c.organization_id = $1
         AND c.is_system = false
         AND t.name LIKE 'E2E %'
         AND NOT EXISTS (
           SELECT 1 FROM employee_absences a WHERE a.absence_category_id = c.id
         )
         AND NOT EXISTS (
           SELECT 1 FROM employee_absence_days d WHERE d.absence_category_id = c.id
         )
     ),
     del_t AS (
       DELETE FROM employee_absence_category_translations
       WHERE category_id IN (SELECT id FROM e2e)
       RETURNING 1
     )
     DELETE FROM employee_absence_categories
     WHERE id IN (SELECT id FROM e2e)
     RETURNING id`,
    [ORG_ID],
  );
  if (e2eDeleted.rowCount && e2eDeleted.rowCount > 0) {
    console.log(
      `✓ Removed ${e2eDeleted.rowCount} leftover E2E absence categories`,
    );
  }

  let created = 0;
  let translations = 0;
  for (const def of CATS) {
    const existing = await c.query(
      `SELECT id FROM employee_absence_categories
       WHERE organization_id = $1 AND system_code = $2`,
      [ORG_ID, def.code],
    );
    let categoryId: string;
    if (existing.rows.length === 0) {
      categoryId = randomUUID();
      await c.query(
        `INSERT INTO employee_absence_categories (
           id, version, "isActive", "isArchived", "createdAt", "updatedAt",
           organization_id, system_code, is_system,
           counts_as_work_time, is_paid, affects_vacation_balance,
           default_is_vacation_capable, reduces_vacation_entitlement_after_days,
           requires_certificate, certificate_required_from_day, max_days_per_year,
           default_percentage, requires_approval, color, icon_name, sort_order
         ) VALUES (
           $1, 1, true, false, now(), now(),
           $2, $3, true,
           $4, $5, $6,
           $7, $8,
           $9, $10, $11,
           $12, $13, $14, $15, $16
         )`,
        [
          categoryId,
          ORG_ID,
          def.code,
          def.countsAsWorkTime,
          def.isPaid,
          def.affectsVacationBalance,
          def.defaultIsVacationCapable,
          def.reducesVacationEntitlementAfterDays,
          def.requiresCertificate,
          def.certificateRequiredFromDay,
          def.maxDaysPerYear,
          def.defaultPercentage,
          def.requiresApproval,
          def.color,
          def.iconName,
          def.sortOrder,
        ],
      );
      created++;
    } else {
      categoryId = (existing.rows[0] as { id: string }).id;
    }

    for (const locale of ['DE', 'FR', 'IT', 'EN'] as const) {
      const t = def.translations[locale];
      await c.query(
        `INSERT INTO employee_absence_category_translations
           (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            category_id, locale, name, description)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5)
         ON CONFLICT (category_id, locale)
         DO UPDATE SET name = EXCLUDED.name,
                       description = EXCLUDED.description,
                       "updatedAt" = now()`,
        [randomUUID(), categoryId, locale, t.name, t.description],
      );
      translations++;
    }
  }
  console.log(
    `✓ System absence categories: +${created} created, ${translations} translations synced`,
  );
}

/**
 * Employee-management seed: contracts, company vacations (+ assignments),
 * absences, teams (+ members), time tracking entries/periods.
 *
 * All employees/memberships/users were already created by the USERS loop in
 * main(). We resolve them here by better-auth email (unique, stable across
 * re-runs) rather than passing IDs around, so this function stays
 * self-contained and safe to re-run independently.
 */
async function seedEmployeeManagement(c: Client, ORG_ID: string) {
  // Employees keyed by email, restricted to the seeded teacher/staff personas
  // (skip PARENT/STUDENT personas — none exist in USERS today, but this keeps
  // the query correct if that ever changes).
  const { rows: staff } = await c.query<{
    email: string;
    employee_id: string;
    membership_id: string;
  }>(
    `SELECT ue.email, m.employee_id, m.id AS membership_id
       FROM memberships m
       JOIN user_emails ue ON ue.id = m.user_email_id
      WHERE m.organization_id = $1 AND m.employee_id IS NOT NULL`,
    [ORG_ID],
  );
  // De-dup (a membership can have >1 role row) and index by email.
  const byEmail = new Map<
    string,
    { employeeId: string; membershipId: string }
  >();
  for (const row of staff) {
    if (!byEmail.has(row.email)) {
      byEmail.set(row.email, {
        employeeId: row.employee_id,
        membershipId: row.membership_id,
      });
    }
  }
  const officeEmails = USERS.filter((u) => !u.isTeacher).map((u) => u.email);

  // -------- 10a. Employee contracts --------
  let contractsAdded = 0;
  const CONTRACT_DEFAULTS: Record<
    string,
    { workload: number; type: string; position: string }
  > = {
    'admin@testschule.ch': {
      workload: 100,
      type: 'PERMANENT',
      position: 'Schulleitung',
    },
    'hr@testschule.ch': {
      workload: 80,
      type: 'PERMANENT',
      position: 'HR-Verantwortliche',
    },
    'sekretariat@testschule.ch': {
      workload: 60,
      type: 'PERMANENT',
      position: 'Sekretariat',
    },
    'sandra.lehrerin@testschule.ch': {
      workload: 100,
      type: 'PERMANENT',
      position: 'Klassenlehrperson',
    },
    'thomas.lehrer@testschule.ch': {
      workload: 100,
      type: 'PERMANENT',
      position: 'Klassenlehrperson',
    },
    'mira.assistentin@testschule.ch': {
      workload: 60,
      type: 'PERMANENT',
      position: 'Assistenz',
    },
    'daniel.lehrer@testschule.ch': {
      workload: 80,
      type: 'PERMANENT',
      position: 'Fachlehrperson',
    },
    'petra.lehrerin@testschule.ch': {
      workload: 40,
      type: 'TEMPORARY',
      position: 'Fachlehrperson (befristet)',
    },
    'lukas.hauswart@testschule.ch': {
      workload: 50,
      type: 'PERMANENT',
      position: 'Hauswart',
    },
  };
  for (const [email, def] of Object.entries(CONTRACT_DEFAULTS)) {
    const person = byEmail.get(email);
    if (!person) continue;
    const { rows: existing } = await c.query(
      `SELECT id FROM employee_contracts WHERE employee_id = $1 AND start_date = '2025-08-01'`,
      [person.employeeId],
    );
    if (existing[0]) continue;
    await c.query(
      `INSERT INTO employee_contracts (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            organization_id, employee_id, start_date, contract_type, "position",
            workload_percent, annual_vacation_days, has_13th_salary)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, '2025-08-01', $4, $5, $6, 25, true)`,
      [
        randomUUID(),
        ORG_ID,
        person.employeeId,
        def.type,
        def.position,
        def.workload,
      ],
    );
    contractsAdded++;
  }
  console.log(`✓ Employee contracts (+${contractsAdded})`);

  // -------- 10b. Company vacations + assignments --------
  const COMPANY_VACATIONS: {
    name: string;
    start: string;
    end: string;
    effectiveDays: number;
  }[] = [
    {
      name: 'Sommerferien 2026',
      start: '2026-07-06',
      end: '2026-08-16',
      effectiveDays: 30,
    },
    {
      name: 'Weihnachtsferien 2025/26',
      start: '2025-12-22',
      end: '2026-01-04',
      effectiveDays: 10,
    },
    {
      name: 'Sportferien 2026',
      start: '2026-02-09',
      end: '2026-02-20',
      effectiveDays: 10,
    },
  ];
  let vacationsAdded = 0;
  let vacationAssignmentsAdded = 0;
  const allStaffIds = [...byEmail.values()].map((p) => p.employeeId);
  for (const v of COMPANY_VACATIONS) {
    let vacationId: string;
    const { rows: existing } = await c.query<{ id: string }>(
      `SELECT id FROM company_vacations WHERE organization_id = $1 AND name = $2`,
      [ORG_ID, v.name],
    );
    if (existing[0]) {
      vacationId = existing[0].id;
    } else {
      vacationId = randomUUID();
      await c.query(
        `INSERT INTO company_vacations (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, name, start_date, end_date, effective_days)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6)`,
        [vacationId, ORG_ID, v.name, v.start, v.end, v.effectiveDays],
      );
      vacationsAdded++;
    }
    for (const employeeId of allStaffIds) {
      const { rowCount } = await c.query(
        `INSERT INTO company_vacation_assignments (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, company_vacation_id, employee_id)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4)
         ON CONFLICT (company_vacation_id, employee_id) DO NOTHING`,
        [randomUUID(), ORG_ID, vacationId, employeeId],
      );
      vacationAssignmentsAdded += rowCount ?? 0;
    }
  }
  console.log(
    `✓ Company vacations (+${vacationsAdded}), assignments (+${vacationAssignmentsAdded})`,
  );

  // -------- 10c. Employee absences --------
  // Reuses the system absence categories seeded by ensureSystemAbsenceCategories
  // (run earlier in main()) — looked up by system_code.
  const ABSENCES: {
    email: string;
    categoryCode: string;
    start: string;
    end: string;
  }[] = [
    {
      email: 'sandra.lehrerin@testschule.ch',
      categoryCode: 'SICKNESS',
      start: '2026-01-12',
      end: '2026-01-14',
    },
    {
      email: 'thomas.lehrer@testschule.ch',
      categoryCode: 'TRAINING',
      start: '2026-03-02',
      end: '2026-03-03',
    },
  ];
  let absencesAdded = 0;
  for (const a of ABSENCES) {
    const person = byEmail.get(a.email);
    if (!person) continue;
    const { rows: catRows } = await c.query<{ id: string }>(
      `SELECT id FROM employee_absence_categories WHERE organization_id = $1 AND system_code = $2`,
      [ORG_ID, a.categoryCode],
    );
    const categoryId = catRows[0]?.id;
    if (!categoryId) continue;
    const { rows: existing } = await c.query(
      `SELECT id FROM employee_absences
        WHERE employee_id = $1 AND "startDate" = $2::timestamptz`,
      [person.employeeId, a.start],
    );
    if (existing[0]) continue;
    await c.query(
      `INSERT INTO employee_absences (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            organization_id, membership_id, employee_id, absence_category_id, "startDate", "endDate")
       VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)`,
      [
        randomUUID(),
        ORG_ID,
        person.membershipId,
        person.employeeId,
        categoryId,
        a.start,
        a.end,
      ],
    );
    absencesAdded++;
  }
  console.log(`✓ Employee absences (+${absencesAdded})`);

  // -------- 10d. Teams + team members --------
  const TEAMS: { name: string; memberEmails: string[]; leadEmail: string }[] = [
    {
      name: 'Unterrichtsteam Primarstufe',
      memberEmails: [
        'sandra.lehrerin@testschule.ch',
        'thomas.lehrer@testschule.ch',
        'mira.assistentin@testschule.ch',
        'daniel.lehrer@testschule.ch',
      ],
      leadEmail: 'sandra.lehrerin@testschule.ch',
    },
    {
      name: 'Administration',
      memberEmails: [
        'admin@testschule.ch',
        'hr@testschule.ch',
        'sekretariat@testschule.ch',
      ],
      leadEmail: 'admin@testschule.ch',
    },
  ];
  let teamsAdded = 0;
  let teamMembersAdded = 0;
  for (const t of TEAMS) {
    let teamId: string;
    const { rows: existing } = await c.query<{ id: string }>(
      `SELECT id FROM teams WHERE organization_id = $1 AND name = $2`,
      [ORG_ID, t.name],
    );
    if (existing[0]) {
      teamId = existing[0].id;
    } else {
      teamId = randomUUID();
      await c.query(
        `INSERT INTO teams (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, name, "sortOrder")
         VALUES ($1, 1, true, false, now(), now(), $2, $3, 0)`,
        [teamId, ORG_ID, t.name],
      );
      teamsAdded++;
    }
    for (const email of t.memberEmails) {
      const person = byEmail.get(email);
      if (!person) continue;
      const role = email === t.leadEmail ? 'LEAD' : 'MEMBER';
      const { rowCount } = await c.query(
        `INSERT INTO team_members (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, team_id, employee_id, role)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5)
         ON CONFLICT (team_id, employee_id) DO NOTHING`,
        [randomUUID(), ORG_ID, teamId, person.employeeId, role],
      );
      teamMembersAdded += rowCount ?? 0;
    }
  }
  console.log(`✓ Teams (+${teamsAdded}), team members (+${teamMembersAdded})`);

  // -------- 10e. Time tracking (enable flag + a few weeks of entries) ------
  // Enable time tracking for office/admin staff (teachers stay off — school
  // classes track lesson time via lesson_records, not clock in/out).
  const TIME_TRACKING_EMAILS = officeEmails;
  await c.query(
    `UPDATE employees SET time_tracking_enabled = true
      WHERE id = ANY($1::uuid[])`,
    [
      TIME_TRACKING_EMAILS.map((e) => byEmail.get(e)?.employeeId).filter(
        (id): id is string => Boolean(id),
      ),
    ],
  );

  // Time-tracking period covering the last ~8 weeks, so seeded entries have
  // somewhere to reconcile into.
  const periodStart = new Date();
  periodStart.setUTCDate(periodStart.getUTCDate() - 56);
  periodStart.setUTCDate(1); // normalize to month start for a stable label
  const periodStartStr = periodStart.toISOString().slice(0, 10);
  const periodEnd = new Date();
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 30);
  const periodEndStr = periodEnd.toISOString().slice(0, 10);
  const periodLabel = `${periodStart.getUTCFullYear()}`;

  const { rows: existingPeriod } = await c.query<{ id: string }>(
    `SELECT id FROM time_tracking_periods WHERE organization_id = $1 AND start_date = $2`,
    [ORG_ID, periodStartStr],
  );
  if (!existingPeriod[0]) {
    const periodId = randomUUID();
    await c.query(
      `INSERT INTO time_tracking_periods (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            organization_id, label, start_date, end_date, status)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, 'OPEN')`,
      [periodId, ORG_ID, periodLabel, periodStartStr, periodEndStr],
    );
    console.log(`✓ Time-tracking period "${periodLabel}" created`);
  }

  // Weekday entries for the last 6 weeks, Mon–Fri, ~08:00–17:00 with a lunch
  // break — deterministic per employee+day via pickInRange so re-runs match.
  let entriesAdded = 0;
  const SEED_TT_NOTE = '__seed_tt__';
  for (const email of TIME_TRACKING_EMAILS) {
    const person = byEmail.get(email);
    if (!person) continue;
    for (let weekAgo = 0; weekAgo < 6; weekAgo++) {
      for (let dow = 1; dow <= 5; dow++) {
        // Monday=1..Friday=5
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        const currentDow = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
        d.setUTCDate(d.getUTCDate() - weekAgo * 7 - (currentDow - dow));
        const entryDate = d.toISOString().slice(0, 10);
        // Skip future dates (dow after "today" in the current week).
        if (d.getTime() > Date.now()) continue;

        const { rows: existing } = await c.query(
          `SELECT 1 FROM time_tracking_entries
            WHERE employee_id = $1 AND entry_date = $2 AND notes = $3`,
          [person.employeeId, entryDate, SEED_TT_NOTE],
        );
        if (existing[0]) continue;

        const startHour = pickInRange(
          `${person.employeeId}:${entryDate}`,
          'startH',
          7,
          8,
        );
        const startMin = pickInRange(
          `${person.employeeId}:${entryDate}`,
          'startM',
          0,
          59,
        );
        const workMinutes = pickInRange(
          `${person.employeeId}:${entryDate}`,
          'workMin',
          370,
          470,
        ); // ~6.2h–7.8h
        const breakMinutes = 30;
        const startedAt = new Date(
          `${entryDate}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00Z`,
        );
        const endedAt = new Date(
          startedAt.getTime() + (workMinutes + breakMinutes) * 60_000,
        );

        await c.query(
          `INSERT INTO time_tracking_entries (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                organization_id, employee_id, started_at, ended_at, break_minutes, entry_date, work_minutes, source, notes)
           VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, $7, $8, 'MANUAL', $9)`,
          [
            randomUUID(),
            ORG_ID,
            person.employeeId,
            startedAt.toISOString(),
            endedAt.toISOString(),
            breakMinutes,
            entryDate,
            workMinutes,
            SEED_TT_NOTE,
          ],
        );
        entriesAdded++;
      }
    }
  }
  console.log(`✓ Time-tracking entries (+${entriesAdded})`);
}

/**
 * Project-management seed: a couple of projects with members drawn from the
 * seeded staff, a handful of tasks per project in varying states, one
 * protocol.
 */
async function seedProjectManagement(c: Client, ORG_ID: string) {
  const { rows: staff } = await c.query<{
    email: string;
    membership_id: string;
  }>(
    `SELECT ue.email, m.id AS membership_id
       FROM memberships m
       JOIN user_emails ue ON ue.id = m.user_email_id
      WHERE m.organization_id = $1 AND m.employee_id IS NOT NULL`,
    [ORG_ID],
  );
  const membershipByEmail = new Map(
    staff.map((s) => [s.email, s.membership_id]),
  );
  const adminMembershipId = membershipByEmail.get('admin@testschule.ch');

  const PROJECTS: {
    title: string;
    description: string;
    status: string;
    color: string;
    memberEmails: string[];
    ownerEmail: string;
    tasks: { title: string; status: string; priority: string }[];
  }[] = [
    {
      title: 'Schuljahresstart 2026/27',
      description:
        'Vorbereitung des neuen Schuljahres: Klasseneinteilung, Material, Elternabende.',
      status: 'ACTIVE',
      color: '#6366F1',
      memberEmails: [
        'admin@testschule.ch',
        'sekretariat@testschule.ch',
        'sandra.lehrerin@testschule.ch',
      ],
      ownerEmail: 'admin@testschule.ch',
      tasks: [
        {
          title: 'Klassenlisten finalisieren',
          status: 'DONE',
          priority: 'HIGH',
        },
        {
          title: 'Elternabend Termine fixieren',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        },
        { title: 'Material bestellen', status: 'OPEN', priority: 'MEDIUM' },
        {
          title: 'Stundenplan Entwurf prüfen',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
        },
      ],
    },
    {
      title: 'Digitalisierung Lernmaterial',
      description:
        'Montessori-Lernmaterial digital katalogisieren und Fotos ergänzen.',
      status: 'ACTIVE',
      color: '#22C55E',
      memberEmails: [
        'thomas.lehrer@testschule.ch',
        'mira.assistentin@testschule.ch',
        'daniel.lehrer@testschule.ch',
      ],
      ownerEmail: 'thomas.lehrer@testschule.ch',
      tasks: [
        {
          title: 'Sinnesmaterial fotografieren',
          status: 'DONE',
          priority: 'LOW',
        },
        {
          title: 'Mathematik-Material katalogisieren',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
        },
        {
          title: 'Sprachmaterial katalogisieren',
          status: 'OPEN',
          priority: 'MEDIUM',
        },
        { title: 'Review mit Kollegium', status: 'BLOCKED', priority: 'LOW' },
      ],
    },
    {
      title: 'Gebäudeunterhalt Sommer',
      description: 'Wartungsarbeiten während der Sommerferien.',
      status: 'ON_HOLD',
      color: '#F97316',
      memberEmails: ['lukas.hauswart@testschule.ch', 'admin@testschule.ch'],
      ownerEmail: 'lukas.hauswart@testschule.ch',
      tasks: [
        { title: 'Heizung warten', status: 'OPEN', priority: 'HIGH' },
        { title: 'Fassade streichen', status: 'OPEN', priority: 'LOW' },
      ],
    },
  ];

  let projectsAdded = 0;
  let membersAdded = 0;
  let tasksAdded = 0;
  let assigneesAdded = 0;

  for (const p of PROJECTS) {
    const ownerMembershipId =
      membershipByEmail.get(p.ownerEmail) ?? adminMembershipId;
    let projectId: string;
    const { rows: existing } = await c.query<{ id: string }>(
      `SELECT id FROM projects WHERE organization_id = $1 AND title = $2`,
      [ORG_ID, p.title],
    );
    if (existing[0]) {
      projectId = existing[0].id;
    } else {
      projectId = randomUUID();
      await c.query(
        `INSERT INTO projects (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, title, description, status, color, created_by_membership_id)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, $7)`,
        [
          projectId,
          ORG_ID,
          p.title,
          p.description,
          p.status,
          p.color,
          ownerMembershipId ?? null,
        ],
      );
      projectsAdded++;
    }

    for (const email of p.memberEmails) {
      const membershipId = membershipByEmail.get(email);
      if (!membershipId) continue;
      const role = email === p.ownerEmail ? 'OWNER' : 'MEMBER';
      const { rowCount } = await c.query(
        `INSERT INTO project_members (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, project_id, membership_id, role)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5)
         ON CONFLICT (project_id, membership_id) DO NOTHING`,
        [randomUUID(), ORG_ID, projectId, membershipId, role],
      );
      membersAdded += rowCount ?? 0;
    }

    let sortOrder = 0;
    for (const t of p.tasks) {
      const { rows: existingTask } = await c.query(
        `SELECT id FROM tasks WHERE organization_id = $1 AND project_id = $2 AND title = $3`,
        [ORG_ID, projectId, t.title],
      );
      if (existingTask[0]) {
        sortOrder++;
        continue;
      }
      const taskId = randomUUID();
      const completedAt = t.status === 'DONE' ? new Date().toISOString() : null;
      await c.query(
        `INSERT INTO tasks (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, project_id, title, status, priority, sort_order,
              checklist, notes, created_by_membership_id, completed_at)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, $7, '[]'::jsonb, '[]'::jsonb, $8, $9)`,
        [
          taskId,
          ORG_ID,
          projectId,
          t.title,
          t.status,
          t.priority,
          sortOrder++,
          ownerMembershipId ?? null,
          completedAt,
        ],
      );
      tasksAdded++;

      // Assign 1 member as the task assignee (deterministic: first project member).
      const assigneeMembershipId = membershipByEmail.get(p.memberEmails[0]);
      if (assigneeMembershipId) {
        const { rowCount } = await c.query(
          `INSERT INTO task_assignees (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                organization_id, task_id, membership_id, sort_order)
           VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, 0)
           ON CONFLICT (task_id, membership_id) DO NOTHING`,
          [randomUUID(), ORG_ID, taskId, assigneeMembershipId],
        );
        assigneesAdded += rowCount ?? 0;
      }
    }
  }
  console.log(
    `✓ Projects (+${projectsAdded}), members (+${membersAdded}), tasks (+${tasksAdded}), assignees (+${assigneesAdded})`,
  );

  // -------- One protocol (meeting minutes) on the first project --------
  const { rows: firstProject } = await c.query<{ id: string }>(
    `SELECT id FROM projects WHERE organization_id = $1 AND title = $2`,
    [ORG_ID, PROJECTS[0].title],
  );
  if (firstProject[0]) {
    const { rows: existingProtocol } = await c.query(
      `SELECT id FROM protocols WHERE organization_id = $1 AND project_id = $2 AND title = $3`,
      [ORG_ID, firstProject[0].id, 'Kickoff Schuljahresstart'],
    );
    if (!existingProtocol[0]) {
      const sections = {
        agendaItems: [
          { no: 1, topic: 'Klasseneinteilung', goal: 'DECISION' },
          { no: 2, topic: 'Elternabende', goal: 'DISCUSSION' },
        ],
        decisions: [
          {
            topic: 'Klasseneinteilung PA/PB',
            decision: 'Aufteilung nach Alter, finale Liste bis Ende Monat',
            responsible: 'Anna Admin',
          },
        ],
        communications: [
          {
            topic: 'Elternbrief Schuljahresstart',
            audience: 'Alle Eltern',
            channel: 'E-Mail',
          },
        ],
        infoPoints: ['Neues Sinnesmaterial ist eingetroffen.'],
        challenges: [],
        openPoints: [
          {
            topic: 'Stundenplan Feinschliff',
            nextStep: 'Entwurf bis nächste Sitzung',
            forNextMeeting: true,
          },
        ],
      };
      await c.query(
        `INSERT INTO protocols (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, project_id, title, meeting_date, status, created_by_membership_id, sections)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, 'FINALIZED', $6, $7::jsonb)`,
        [
          randomUUID(),
          ORG_ID,
          firstProject[0].id,
          'Kickoff Schuljahresstart',
          '2025-08-11',
          adminMembershipId ?? null,
          JSON.stringify(sections),
        ],
      );
      console.log('✓ Protocol "Kickoff Schuljahresstart" created');
    }
  }
}

/**
 * Chats seed: a direct conversation between two teachers and a group
 * conversation for the admin team, each with a handful of messages.
 */
async function seedChats(c: Client, ORG_ID: string) {
  const { rows: staff } = await c.query<{
    email: string;
    membership_id: string;
  }>(
    `SELECT ue.email, m.id AS membership_id
       FROM memberships m
       JOIN user_emails ue ON ue.id = m.user_email_id
      WHERE m.organization_id = $1 AND m.employee_id IS NOT NULL`,
    [ORG_ID],
  );
  const membershipByEmail = new Map(
    staff.map((s) => [s.email, s.membership_id]),
  );

  const CONVERSATIONS: {
    type: 'DIRECT' | 'GROUP';
    name: string | null;
    participantEmails: string[];
    messages: { fromEmail: string; body: string }[];
  }[] = [
    {
      type: 'DIRECT',
      name: null,
      participantEmails: [
        'sandra.lehrerin@testschule.ch',
        'thomas.lehrer@testschule.ch',
      ],
      messages: [
        {
          fromEmail: 'sandra.lehrerin@testschule.ch',
          body: 'Hoi Thomas, hast du das Material für die Klasse PA schon vorbereitet?',
        },
        {
          fromEmail: 'thomas.lehrer@testschule.ch',
          body: 'Ja, liegt bereit im Regal. Sinnesmaterial ist auch schon sortiert.',
        },
        {
          fromEmail: 'sandra.lehrerin@testschule.ch',
          body: 'Perfekt, danke dir!',
        },
      ],
    },
    {
      type: 'GROUP',
      name: 'Administration',
      participantEmails: [
        'admin@testschule.ch',
        'hr@testschule.ch',
        'sekretariat@testschule.ch',
      ],
      messages: [
        {
          fromEmail: 'admin@testschule.ch',
          body: 'Kurzes Update: Elternabend-Termine sind fixiert, siehe Projekt.',
        },
        {
          fromEmail: 'sekretariat@testschule.ch',
          body: 'Super, ich verschicke die Einladungen diese Woche.',
        },
        {
          fromEmail: 'hr@testschule.ch',
          body: 'Danke — ich ergänze die Termine im HR-Kalender.',
        },
      ],
    },
  ];

  let conversationsAdded = 0;
  let participantsAdded = 0;
  let messagesAdded = 0;

  for (const conv of CONVERSATIONS) {
    const participantIds = conv.participantEmails
      .map((e) => membershipByEmail.get(e))
      .filter((id): id is string => Boolean(id));
    if (participantIds.length < 2) continue;

    let conversationId: string;
    if (conv.type === 'GROUP') {
      const { rows: existing } = await c.query<{ id: string }>(
        `SELECT id FROM conversations WHERE organization_id = $1 AND type = 'GROUP' AND name = $2`,
        [ORG_ID, conv.name],
      );
      if (existing[0]) {
        conversationId = existing[0].id;
      } else {
        conversationId = randomUUID();
        await c.query(
          `INSERT INTO conversations (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                organization_id, type, name)
           VALUES ($1, 1, true, false, now(), now(), $2, 'GROUP', $3)`,
          [conversationId, ORG_ID, conv.name],
        );
        conversationsAdded++;
      }
    } else {
      // DIRECT: idempotency via the participant pair (no natural unique key
      // on the conversation itself for DIRECT/GROUP — only TEAM conversations
      // have a unique (org, team) constraint).
      const { rows: existing } = await c.query<{ id: string }>(
        `SELECT cv.id
           FROM conversations cv
          WHERE cv.organization_id = $1 AND cv.type = 'DIRECT'
            AND (SELECT COUNT(*) FROM conversation_participants cp WHERE cp.conversation_id = cv.id) = 2
            AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = cv.id AND cp.membership_id = $2)
            AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = cv.id AND cp.membership_id = $3)
          LIMIT 1`,
        [ORG_ID, participantIds[0], participantIds[1]],
      );
      if (existing[0]) {
        conversationId = existing[0].id;
      } else {
        conversationId = randomUUID();
        await c.query(
          `INSERT INTO conversations (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                organization_id, type, name)
           VALUES ($1, 1, true, false, now(), now(), $2, 'DIRECT', NULL)`,
          [conversationId, ORG_ID],
        );
        conversationsAdded++;
      }
    }

    for (const membershipId of participantIds) {
      const { rowCount } = await c.query(
        `INSERT INTO conversation_participants (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, conversation_id, membership_id, role)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, 'MEMBER')
         ON CONFLICT (conversation_id, membership_id) DO NOTHING`,
        [randomUUID(), ORG_ID, conversationId, membershipId],
      );
      participantsAdded += rowCount ?? 0;
    }

    const { rows: existingMessages } = await c.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM messages WHERE conversation_id = $1`,
      [conversationId],
    );
    if (Number(existingMessages[0]?.count ?? 0) >= conv.messages.length) {
      continue; // already fully seeded on a prior run
    }

    let lastMessageAt: string | null = null;
    for (let i = 0; i < conv.messages.length; i++) {
      const m = conv.messages[i];
      const senderMembershipId = membershipByEmail.get(m.fromEmail);
      if (!senderMembershipId) continue;
      const sentAt = new Date(
        Date.now() - (conv.messages.length - i) * 3_600_000,
      );
      await c.query(
        `INSERT INTO messages (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, conversation_id, sender_membership_id, body)
         VALUES ($1, 1, true, false, $2, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          sentAt.toISOString(),
          ORG_ID,
          conversationId,
          senderMembershipId,
          m.body,
        ],
      );
      lastMessageAt = sentAt.toISOString();
      messagesAdded++;
    }
    if (lastMessageAt) {
      await c.query(
        `UPDATE conversations SET last_message_at = $1 WHERE id = $2`,
        [lastMessageAt, conversationId],
      );
    }
  }
  console.log(
    `✓ Conversations (+${conversationsAdded}), participants (+${participantsAdded}), messages (+${messagesAdded})`,
  );
}

main()
  .then(() => {
    // The Nest app keeps handles open (schedulers, mailer); exit explicitly.
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  });
