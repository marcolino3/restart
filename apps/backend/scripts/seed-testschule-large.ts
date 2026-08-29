/**
 * "Grosse Schule" extension for the Testschule seed (see seed-testschule.ts).
 *
 * Scales the dev org up to something that looks like a real school in
 * live operation:
 *   - 3-level Montessori curriculum imported from the Kindergarten /
 *     Primarschule Excel sheets (Early Childhood, Lower Elementary,
 *     Upper Elementary) — ~1'500 lessons incl. lesson type/scale.
 *   - ~12 classes from Kinderhaus to Oberstufe across 6 grade levels.
 *   - 250 students with families (parents, step-parents, grandparents,
 *     nannies, aunts/uncles), siblings sharing one family.
 *   - 50 staff (class leads, teachers, assistants, specialists, office,
 *     facility, kitchen, after-school care) with contracts, absences,
 *     vacations, teams and time-tracking entries.
 *   - Lesson records (record keeping) for every student matching their
 *     level, with Hattie/Montessori observation axes.
 *   - Student notes, admission pipeline for the next school year, and
 *     meeting protocols.
 *
 * Everything is deterministic (sha256-seeded) and idempotent — re-running
 * the seed adds nothing new. All functions are called from
 * seed-testschule.ts's main(); this file is not an entry point on its own.
 */
import { Client } from 'pg';
import { createHash, randomUUID, randomBytes } from 'crypto';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { INestApplicationContext } from '@nestjs/common';
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

function rnd(key: string, salt = ''): number {
  const h = createHash('sha256').update(`${key}::${salt}`).digest();
  return h.readUInt32BE(0) / 0x100000000;
}
function rInt(key: string, salt: string, min: number, max: number): number {
  return Math.floor(min + rnd(key, salt) * (max - min + 1));
}
function pick<T>(key: string, salt: string, arr: readonly T[]): T {
  return arr[Math.floor(rnd(key, salt) * arr.length)];
}
/** Weighted pick: entries [value, weight]. */
function pickW<T>(
  key: string,
  salt: string,
  entries: readonly (readonly [T, number])[],
): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let x = rnd(key, salt) * total;
  for (const [v, w] of entries) {
    x -= w;
    if (x <= 0) return v;
  }
  return entries[entries.length - 1][0];
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}
function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() -
      new Date(`${a}T00:00:00Z`).getTime()) /
      86_400_000,
  );
}
function isWeekend(iso: string): boolean {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return dow === 0 || dow === 6;
}
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/é|è|ê/g, 'e')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
const baId = (len = 32) => randomBytes(len).toString('base64url').slice(0, len);

const TODAY = isoDate(new Date());
const SCHOOL_YEAR_START = '2025-08-18';

// ---------------------------------------------------------------------------
// Name pools (Swiss / multicultural mix)
// ---------------------------------------------------------------------------

const GIRL_NAMES = [
  'Mia',
  'Emma',
  'Lina',
  'Elena',
  'Sofia',
  'Lea',
  'Nora',
  'Emilia',
  'Alina',
  'Lara',
  'Anna',
  'Leonie',
  'Lia',
  'Mila',
  'Elin',
  'Livia',
  'Juna',
  'Zoe',
  'Ella',
  'Amelie',
  'Malea',
  'Chiara',
  'Nina',
  'Noemi',
  'Giulia',
  'Selina',
  'Yara',
  'Ida',
  'Luisa',
  'Aurelia',
  'Flurina',
  'Seraina',
  'Ronja',
  'Mara',
  'Fiona',
  'Elisa',
  'Hanna',
  'Sara',
  'Ayla',
  'Amira',
  'Meret',
  'Jana',
  'Valentina',
  'Olivia',
  'Melina',
  'Enya',
  'Lynn',
  'Tabea',
  'Céline',
  'Julia',
];
const BOY_NAMES = [
  'Noah',
  'Liam',
  'Matteo',
  'Leon',
  'Luca',
  'Elias',
  'Louis',
  'Levin',
  'Finn',
  'Nino',
  'Gian',
  'Ben',
  'Julian',
  'Jonas',
  'Leano',
  'Mattia',
  'Samuel',
  'David',
  'Nils',
  'Emil',
  'Aaron',
  'Lio',
  'Dario',
  'Timo',
  'Andrin',
  'Elia',
  'Diego',
  'Rafael',
  'Yannick',
  'Fabio',
  'Jan',
  'Silvan',
  'Lenny',
  'Mael',
  'Kilian',
  'Robin',
  'Tim',
  'Joel',
  'Nevio',
  'Laurin',
  'Jonah',
  'Amir',
  'Enes',
  'Milan',
  'Luis',
  'Oskar',
  'Lorenz',
  'Flurin',
  'Cyrill',
  'Moritz',
];
const LAST_NAMES = [
  'Müller',
  'Meier',
  'Schmid',
  'Keller',
  'Weber',
  'Huber',
  'Schneider',
  'Meyer',
  'Steiner',
  'Fischer',
  'Gerber',
  'Brunner',
  'Baumann',
  'Frei',
  'Zimmermann',
  'Moser',
  'Widmer',
  'Wyss',
  'Graf',
  'Roth',
  'Suter',
  'Bühler',
  'Lehmann',
  'Hofer',
  'Kaufmann',
  'Marti',
  'Bachmann',
  'Berger',
  'Lüthi',
  'Studer',
  'Kunz',
  'Kohler',
  'Egli',
  'Vogel',
  'Hess',
  'Brand',
  'Peter',
  'Rossi',
  'Bianchi',
  'Ferrari',
  'Costa',
  'Ricci',
  'Colombo',
  'Da Silva',
  'Pereira',
  'Santos',
  'Oliveira',
  'Yilmaz',
  'Demir',
  'Kaya',
  'Öztürk',
  'Novak',
  'Kovač',
  'Petrović',
  'Nguyen',
  'Tran',
  'Patel',
  'Haddad',
  'Fernández',
  'García',
  'Martin',
  'Dubois',
  'Favre',
  'Rochat',
  'Caduff',
  'Cavelti',
  'Derungs',
  'Jenny',
  'Ackermann',
  'Wenger',
  'Zbinden',
  'Stalder',
  'Aebischer',
  'Bieri',
  'Wüthrich',
  'Rüegg',
  'Grob',
  'Sigrist',
  'Tanner',
];
const WOMEN = [
  'Sandra',
  'Claudia',
  'Nicole',
  'Barbara',
  'Andrea',
  'Daniela',
  'Karin',
  'Monika',
  'Petra',
  'Susanne',
  'Sabine',
  'Manuela',
  'Nadine',
  'Simone',
  'Franziska',
  'Stefanie',
  'Corinne',
  'Martina',
  'Silvia',
  'Bettina',
  'Regula',
  'Fabienne',
  'Jasmin',
  'Melanie',
  'Tanja',
  'Yvonne',
  'Esther',
  'Ursula',
  'Katrin',
  'Michèle',
  'Laura',
  'Sarah',
  'Nadja',
  'Vera',
  'Rahel',
  'Ana',
  'Elif',
  'Fatima',
  'Giulia',
  'Ines',
  'Maria',
  'Sonja',
  'Bernadette',
];
const MEN = [
  'Thomas',
  'Daniel',
  'Michael',
  'Peter',
  'Andreas',
  'Christian',
  'Markus',
  'Stefan',
  'Martin',
  'Patrick',
  'Marco',
  'Reto',
  'Roger',
  'Beat',
  'Urs',
  'Adrian',
  'Lukas',
  'Pascal',
  'Philipp',
  'Simon',
  'Fabian',
  'Matthias',
  'Christoph',
  'Roman',
  'Sven',
  'Marcel',
  'David',
  'Tobias',
  'Dominik',
  'Florian',
  'Raphael',
  'Silvan',
  'Ahmet',
  'Luís',
  'Paulo',
  'Giovanni',
  'Ivan',
  'Nenad',
  'Samir',
  'Diego',
  'Jürg',
  'Hansruedi',
  'Bruno',
];
const OCCUPATIONS = [
  'Pflegefachfrau',
  'Informatiker',
  'Lehrerin',
  'Architekt',
  'Ärztin',
  'Projektleiter',
  'Physiotherapeutin',
  'Elektriker',
  'Juristin',
  'Kaufmann',
  'Grafikerin',
  'Ingenieur',
  'Sozialarbeiterin',
  'Koch',
  'Apothekerin',
  'Schreiner',
  'Marketing-Managerin',
  'Bankangestellter',
  'Hebamme',
  'Landwirt',
  'Psychologin',
  'Polizist',
  'Dolmetscherin',
  'Selbständig',
  'Hausfrau / Hausmann',
  'Zahnärztin',
  'Logistiker',
  'Kindergärtnerin',
  'Unternehmer',
  'Forscherin (ETH)',
];
const CITIES = [
  'Zürich',
  'Winterthur',
  'Uster',
  'Wetzikon',
  'Dübendorf',
  'Kloten',
  'Bülach',
  'Dietikon',
  'Horgen',
  'Wädenswil',
  'Meilen',
  'Küsnacht',
  'Rapperswil',
  'Baden',
  'Zug',
  'Luzern',
  'Bern',
  'Basel',
  'Aarau',
];
const NATIONALITY_MIX: readonly (readonly [string[], number])[] = [
  [['CH'], 62],
  [['CH', 'DE'], 6],
  [['CH', 'IT'], 6],
  [['DE'], 5],
  [['IT'], 3],
  [['PT'], 3],
  [['CH', 'PT'], 2],
  [['TR'], 2],
  [['ES'], 2],
  [['FR'], 2],
  [['GB'], 2],
  [['US'], 1],
  [['RS'], 1],
  [['BA'], 1],
  [['IN'], 1],
  [['VN'], 1],
];
const LANG_BY_NAT: Record<string, string> = {
  CH: 'Deutsch',
  DE: 'Deutsch',
  IT: 'Italienisch',
  PT: 'Portugiesisch',
  TR: 'Türkisch',
  ES: 'Spanisch',
  FR: 'Französisch',
  GB: 'Englisch',
  US: 'Englisch',
  RS: 'Serbisch',
  BA: 'Bosnisch',
  IN: 'Hindi',
  VN: 'Vietnamesisch',
};

// ---------------------------------------------------------------------------
// Curriculum import (Excel → CurriculaImportService.applyPlan)
// ---------------------------------------------------------------------------

const CURRICULUM_SLUG = 'montessori';
const LEVEL_DEFS: Record<
  string,
  { slug: string; name: string; position: number }
> = {
  'Early Childhood': {
    slug: 'early-childhood',
    name: 'Kinderhaus / Kindergarten (Early Childhood, 3–6)',
    position: 0,
  },
  'Lower Elementary': {
    slug: 'lower-elementary',
    name: 'Unterstufe (Lower Elementary, 6–9)',
    position: 1,
  },
  'Upper Elementary': {
    slug: 'upper-elementary',
    name: 'Mittelstufe (Upper Elementary, 9–12)',
    position: 2,
  },
};
// Known typo in the source sheet.
const AREA_FIXES: Record<string, string> = { Geomertrie: 'Geometrie' };

type RawRow = {
  level: string;
  area: string;
  topic: string | null;
  group: string | null;
  lesson: string;
};

function findFile(dir: string, patterns: RegExp[]): string | null {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir);
  for (const p of patterns) {
    const hit = files.find((f) => p.test(f) && f.endsWith('.xlsx'));
    if (hit) return join(dir, hit);
  }
  return null;
}

function readRows(file: string): RawRow[] {
  const wb = XLSX.read(readFileSync(file), { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const out: RawRow[] = [];
  let lastArea = '';
  const str = (v: unknown) =>
    v === undefined || v === null ? null : String(v).trim() || null;
  for (const r of rows.slice(1)) {
    const level = str(r[0]);
    const lesson = str(r[5]);
    if (!level || !lesson || !LEVEL_DEFS[level]) continue;
    const area = str(r[2]) ?? lastArea;
    if (!area) continue;
    lastArea = area;
    out.push({
      level,
      area: AREA_FIXES[area] ?? area,
      topic: str(r[3]),
      group: str(r[4]),
      lesson,
    });
  }
  return out;
}

type PlanNode = {
  nodeType: 'AREA' | 'TOPIC' | 'GROUP' | 'LESSON';
  position: number;
  translations: { locale: 'DE'; name: string }[];
  children: PlanNode[];
};

function buildLevelTree(rows: RawRow[]): PlanNode[] {
  const roots: PlanNode[] = [];
  const index = new Map<string, PlanNode>();
  const ensure = (
    parentKey: string,
    siblings: PlanNode[],
    nodeType: PlanNode['nodeType'],
    name: string,
  ): PlanNode => {
    const key = `${parentKey}/${nodeType}:${name}`;
    let node = index.get(key);
    if (!node) {
      node = {
        nodeType,
        position: siblings.length,
        translations: [{ locale: 'DE', name }],
        children: [],
      };
      siblings.push(node);
      index.set(key, node);
    }
    return node;
  };
  for (const r of rows) {
    const area = ensure('', roots, 'AREA', r.area);
    let parent = area;
    let key = `/AREA:${r.area}`;
    if (r.topic) {
      parent = ensure(key, parent.children, 'TOPIC', r.topic);
      key += `/TOPIC:${r.topic}`;
    }
    if (r.group) {
      parent = ensure(key, parent.children, 'GROUP', r.group);
      key += `/GROUP:${r.group}`;
    }
    // Lessons are not de-duplicated by name — the same title can legitimately
    // appear twice in a sequence (e.g. repeated practice steps).
    parent.children.push({
      nodeType: 'LESSON',
      position: parent.children.length,
      translations: [{ locale: 'DE', name: r.lesson }],
      children: [],
    });
  }
  return roots;
}

/**
 * Lesson type/scale from the Kindergarten record-keeping sheet (columns
 * "Typ" P/S/3PL/E/M and "Skala" Masterable/Ongoing), keyed by lesson name.
 */
function readLessonMeta(
  file: string | null,
): Map<string, { type: string; scale: string }> {
  const map = new Map<string, { type: string; scale: string }>();
  if (!file) return map;
  const wb = XLSX.read(readFileSync(file), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(
    wb.Sheets[wb.SheetNames[0]],
    { header: 1 },
  );
  const TYPE_MAP: Record<string, string> = {
    P: 'P',
    S: 'S',
    '3PL': 'THREE_PL',
    E: 'E',
    M: 'M',
  };
  for (const r of rows) {
    const lesson = r[5] ? String(r[5]).trim() : '';
    const typ = r[6] ? String(r[6]).trim() : '';
    const scale = r[7] ? String(r[7]).trim().toUpperCase() : '';
    if (!lesson || !TYPE_MAP[typ]) continue;
    map.set(lesson, {
      type: TYPE_MAP[typ],
      scale: scale === 'ONGOING' ? 'ONGOING' : 'MASTERABLE',
    });
  }
  return map;
}

export async function seedCurriculaFromXlsx(
  app: INestApplicationContext,
  c: Client,
  ORG_ID: string,
): Promise<void> {
  const baseDir =
    process.env.SEED_CURRICULA_DIR ?? join(homedir(), 'Downloads');
  const kigaFile =
    findFile(join(baseDir, 'curriculum'), [/Kindergarten/i]) ??
    findFile(baseDir, [/Curriculum.*Kindergarten(?!.*RecordKeeping)/i]);
  const primarFile =
    findFile(join(baseDir, 'curriculum'), [/Primarschule/i]) ??
    findFile(baseDir, [/Primarschule/i]);
  const metaFile = findFile(baseDir, [/Kindergarten_RecordKeeping_import/i]);

  const { rows: existing } = await c.query<{ id: string }>(
    `SELECT id FROM curricula WHERE organization_id = $1 AND slug = $2`,
    [ORG_ID, CURRICULUM_SLUG],
  );

  if (!existing[0]) {
    if (!kigaFile && !primarFile) {
      console.warn(
        `⚠ No curriculum Excel files found under ${baseDir} (set SEED_CURRICULA_DIR) — skipping curriculum import`,
      );
      return;
    }
    const rows = [
      ...(kigaFile ? readRows(kigaFile) : []),
      ...(primarFile ? readRows(primarFile) : []),
    ];
    const byLevel = new Map<string, RawRow[]>();
    for (const r of rows) {
      if (!byLevel.has(r.level)) byLevel.set(r.level, []);
      byLevel.get(r.level)!.push(r);
    }
    const levels = [...byLevel.entries()].map(([level, levelRows]) => {
      const def = LEVEL_DEFS[level];
      return {
        slug: def.slug,
        position: def.position,
        translations: [
          { locale: 'DE', name: def.name },
          { locale: 'EN', name: def.name },
        ],
        roots: buildLevelTree(levelRows),
      };
    });

    const { CurriculaImportService } =
      await import('../src/curricula/import/curricula-import.service');
    const importService = app.get(CurriculaImportService);
    await importService.applyPlan(
      {
        curriculumSlug: CURRICULUM_SLUG,
        curriculumTranslations: [
          {
            locale: 'DE',
            name: 'Montessori-Curriculum (Kinderhaus – Mittelstufe)',
          },
          {
            locale: 'EN',
            name: 'Montessori Curriculum (Early Childhood – Upper Elementary)',
          },
        ],
        levels,
      } as never,
      ORG_ID,
    );
    console.log(
      `✓ Curriculum "${CURRICULUM_SLUG}" imported (${levels
        .map(
          (l) =>
            `${l.slug}: ${
              byLevel.get(
                Object.keys(LEVEL_DEFS).find(
                  (k) => LEVEL_DEFS[k].slug === l.slug,
                )!,
              )!.length
            } lessons`,
        )
        .join(', ')})`,
    );
  } else {
    console.log(`✓ Curriculum "${CURRICULUM_SLUG}" already exists`);
  }

  // Lesson type / scale — from the record-keeping sheet where known,
  // deterministic defaults elsewhere. Only fills NULLs, so manual edits stick.
  const meta = readLessonMeta(metaFile);
  const { rows: untyped } = await c.query<{ id: string; name: string }>(
    `SELECT n.id, t.name
       FROM curriculum_nodes n
       JOIN curriculum_node_translations t ON t.curriculum_node_id = n.id AND t.locale = 'DE'
      WHERE n.organization_id = $1 AND n.node_type = 'LESSON' AND n.lesson_type IS NULL`,
    [ORG_ID],
  );
  if (untyped.length > 0) {
    const ids: string[] = [];
    const types: string[] = [];
    const scales: string[] = [];
    for (const n of untyped) {
      const m = meta.get(n.name);
      ids.push(n.id);
      if (m) {
        types.push(m.type);
        scales.push(m.scale);
      } else {
        const lower = n.name.toLowerCase();
        const type = lower.startsWith('erzählung')
          ? 'S'
          : pickW(n.id, 'ltype', [
              ['P', 78],
              ['E', 8],
              ['M', 8],
              ['THREE_PL', 4],
              ['S', 2],
            ]);
        types.push(type);
        scales.push(
          lower.includes('üben') ||
            lower.includes('übung') ||
            rnd(n.id, 'scale') < 0.12
            ? 'ONGOING'
            : 'MASTERABLE',
        );
      }
    }
    await c.query(
      `UPDATE curriculum_nodes n
          SET lesson_type = v.t::curriculum_nodes_lesson_type_enum,
              lesson_scale = v.s::curriculum_nodes_lesson_scale_enum
         FROM unnest($1::uuid[], $2::text[], $3::text[]) AS v(id, t, s)
        WHERE n.id = v.id`,
      [ids, types, scales],
    );
    console.log(
      `✓ Lesson type/scale set on ${untyped.length} lessons (${meta.size} from record-keeping sheet)`,
    );
  }
}

// ---------------------------------------------------------------------------
// Staff user creation (shared with seed-testschule.ts section 6)
// ---------------------------------------------------------------------------

export interface StaffUserDef {
  email: string;
  firstName: string;
  lastName: string;
  persona: string;
  roleCode: string;
}

export interface StaffUserIds {
  appUserId: string;
  membershipId: string;
  employeeId: string;
  created: boolean;
}

/**
 * Idempotently creates app user + user_email + better-auth user/account +
 * employee + membership + role assignment. Returns the ids either way.
 */
export async function ensureStaffUser(
  c: Client,
  ORG_ID: string,
  u: StaffUserDef,
  pwHash: string,
): Promise<StaffUserIds> {
  const { rows: existingEmail } = await c.query<{
    id: string;
    user_id: string;
  }>(`SELECT id, user_id FROM user_emails WHERE email = $1`, [u.email]);
  let appUserId: string;
  let created = false;
  if (existingEmail[0]) {
    appUserId = existingEmail[0].user_id;
  } else {
    created = true;
    appUserId = randomUUID();
    await c.query(
      `INSERT INTO users (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            first_name, last_name, is_super_admin)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, false)`,
      [appUserId, u.firstName, u.lastName],
    );
    await c.query(
      `INSERT INTO user_emails (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            user_id, email, password_hash, is_primary, is_verified)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, true, true)`,
      [randomUUID(), appUserId, u.email, pwHash],
    );
  }

  const { rows: existingBa } = await c.query<{ id: string }>(
    `SELECT id FROM "user" WHERE email = $1`,
    [u.email],
  );
  let baUserId: string;
  if (existingBa[0]) {
    baUserId = existingBa[0].id;
  } else {
    baUserId = baId(32);
    await c.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, now(), now())`,
      [baUserId, `${u.firstName} ${u.lastName}`, u.email],
    );
  }
  const { rows: existingAcct } = await c.query(
    `SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
    [baUserId],
  );
  if (!existingAcct[0]) {
    await c.query(
      `INSERT INTO account (id, "accountId", "providerId", "userId", password, issuer, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, 'local:credential', now(), now())`,
      [baId(32), baUserId, baUserId, pwHash],
    );
  }

  const { rows: ueRows } = await c.query<{ id: string }>(
    `SELECT id FROM user_emails WHERE email = $1 AND user_id = $2`,
    [u.email, appUserId],
  );
  const userEmailId = ueRows[0]?.id;

  const { rows: existingMs } = await c.query<{
    id: string;
    employee_id: string;
  }>(
    `SELECT id, employee_id FROM memberships WHERE organization_id = $1 AND user_id = $2`,
    [ORG_ID, appUserId],
  );
  let membershipId: string;
  let employeeId: string;
  if (existingMs[0]) {
    membershipId = existingMs[0].id;
    employeeId = existingMs[0].employee_id;
  } else {
    employeeId = randomUUID();
    await c.query(
      `INSERT INTO employees (id, version, "isActive", "isArchived", "createdAt", "updatedAt", time_tracking_enabled)
       VALUES ($1, 1, true, false, now(), now(), false)`,
      [employeeId],
    );
    membershipId = randomUUID();
    await c.query(
      `INSERT INTO memberships (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            organization_id, user_id, persona, user_email_id, employee_id)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6)`,
      [membershipId, ORG_ID, appUserId, u.persona, userEmailId, employeeId],
    );
  }

  const { rows: roleRows } = await c.query<{ id: string }>(
    `SELECT id FROM roles WHERE organization_id = $1 AND system_code = $2`,
    [ORG_ID, u.roleCode],
  );
  if (roleRows[0]) {
    await c.query(
      `INSERT INTO membership_roles (membership_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [membershipId, roleRows[0].id],
    );
  }
  return { appUserId, membershipId, employeeId, created };
}

// ---------------------------------------------------------------------------
// School structure: grade levels + classes
// ---------------------------------------------------------------------------

const GRADE_LEVELS: { name: string; sortOrder: number; color: string }[] = [
  { name: 'Vorschule', sortOrder: 0, color: '#FBBF24' },
  { name: 'Kindergarten', sortOrder: 5, color: '#F97316' },
  { name: 'Primarstufe', sortOrder: 10, color: '#6366F1' },
  { name: 'Unterstufe', sortOrder: 12, color: '#06B6D4' },
  { name: 'Mittelstufe', sortOrder: 20, color: '#3B82F6' },
  { name: 'Oberstufe', sortOrder: 30, color: '#8B5CF6' },
];

type LevelKey = 'KIGA' | 'US' | 'MS' | 'OS';

interface ClassDef {
  name: string;
  gradeLevel: string;
  color: string;
  room: string;
  maxCapacity: number;
  /** Target roster size for this class (existing students count). */
  target: number;
  level: LevelKey;
  /** Curriculum level slug used for lesson records. */
  curriculumLevel: string;
  /** Age band [min, max] in years at school-year start. */
  ages: [number, number];
}

export const LARGE_CLASSES: ClassDef[] = [
  // Kinderhaus 1/2 + Klasse PA/PB/OA already exist from the base seed — they
  // are listed here so rosters get filled up to `target` too.
  {
    name: 'Kinderhaus 1',
    gradeLevel: 'Vorschule',
    color: '#FBBF24',
    room: 'Raum 101',
    maxCapacity: 20,
    target: 18,
    level: 'KIGA',
    curriculumLevel: 'early-childhood',
    ages: [3, 5],
  },
  {
    name: 'Kinderhaus 2',
    gradeLevel: 'Vorschule',
    color: '#FBBF24',
    room: 'Raum 102',
    maxCapacity: 20,
    target: 18,
    level: 'KIGA',
    curriculumLevel: 'early-childhood',
    ages: [3, 5],
  },
  {
    name: 'Kindergarten A',
    gradeLevel: 'Kindergarten',
    color: '#F97316',
    room: 'Raum 103',
    maxCapacity: 20,
    target: 18,
    level: 'KIGA',
    curriculumLevel: 'early-childhood',
    ages: [4, 6],
  },
  {
    name: 'Kindergarten B',
    gradeLevel: 'Kindergarten',
    color: '#F97316',
    room: 'Raum 104',
    maxCapacity: 20,
    target: 18,
    level: 'KIGA',
    curriculumLevel: 'early-childhood',
    ages: [4, 6],
  },
  {
    name: 'Unterstufe A',
    gradeLevel: 'Unterstufe',
    color: '#06B6D4',
    room: 'Raum 203',
    maxCapacity: 22,
    target: 20,
    level: 'US',
    curriculumLevel: 'lower-elementary',
    ages: [6, 9],
  },
  {
    name: 'Unterstufe B',
    gradeLevel: 'Unterstufe',
    color: '#06B6D4',
    room: 'Raum 204',
    maxCapacity: 22,
    target: 20,
    level: 'US',
    curriculumLevel: 'lower-elementary',
    ages: [6, 9],
  },
  {
    name: 'Unterstufe C',
    gradeLevel: 'Unterstufe',
    color: '#06B6D4',
    room: 'Raum 205',
    maxCapacity: 22,
    target: 20,
    level: 'US',
    curriculumLevel: 'lower-elementary',
    ages: [6, 9],
  },
  {
    name: 'Klasse PA',
    gradeLevel: 'Primarstufe',
    color: '#6366F1',
    room: 'Raum 201',
    maxCapacity: 24,
    target: 20,
    level: 'US',
    curriculumLevel: 'lower-elementary',
    ages: [7, 10],
  },
  {
    name: 'Klasse PB',
    gradeLevel: 'Primarstufe',
    color: '#6366F1',
    room: 'Raum 202',
    maxCapacity: 24,
    target: 20,
    level: 'US',
    curriculumLevel: 'lower-elementary',
    ages: [7, 10],
  },
  {
    name: 'Mittelstufe A',
    gradeLevel: 'Mittelstufe',
    color: '#3B82F6',
    room: 'Raum 302',
    maxCapacity: 22,
    target: 20,
    level: 'MS',
    curriculumLevel: 'upper-elementary',
    ages: [9, 12],
  },
  {
    name: 'Mittelstufe B',
    gradeLevel: 'Mittelstufe',
    color: '#3B82F6',
    room: 'Raum 303',
    maxCapacity: 22,
    target: 20,
    level: 'MS',
    curriculumLevel: 'upper-elementary',
    ages: [9, 12],
  },
  {
    name: 'Klasse OA',
    gradeLevel: 'Oberstufe',
    color: '#8B5CF6',
    room: 'Raum 301',
    maxCapacity: 22,
    target: 19,
    level: 'OS',
    curriculumLevel: 'upper-elementary',
    ages: [12, 15],
  },
  {
    name: 'Oberstufe B',
    gradeLevel: 'Oberstufe',
    color: '#8B5CF6',
    room: 'Raum 304',
    maxCapacity: 22,
    target: 19,
    level: 'OS',
    curriculumLevel: 'upper-elementary',
    ages: [12, 15],
  },
];
// Sum of targets = 250.

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

interface StaffDef extends StaffUserDef {
  position: string;
  workload: number;
  contractType: string;
  contractStart: string;
  isTeacher: boolean;
  timeTracking: boolean;
  classes: string[];
  team: string;
  teamLead?: boolean;
}

function staffEmail(first: string, last: string): string {
  return `${slugify(first)}.${slugify(last)}@testschule.ch`;
}

function buildStaff(): StaffDef[] {
  const defs: StaffDef[] = [];
  let n = 0;
  const add = (
    gender: 'F' | 'M',
    p: Omit<
      StaffDef,
      'email' | 'firstName' | 'lastName' | 'persona' | 'roleCode'
    > & {
      roleCode?: string;
    },
  ) => {
    const key = `staff:${n++}`;
    const firstName =
      gender === 'F' ? pick(key, 'f', WOMEN) : pick(key, 'f', MEN);
    // Avoid last-name collisions with the base seed personas.
    const lastName = pick(key, 'l', LAST_NAMES);
    defs.push({
      email: staffEmail(firstName, lastName),
      firstName,
      lastName,
      persona: p.isTeacher ? 'TEACHER' : 'EMPLOYEE',
      roleCode: p.roleCode ?? (p.teamLead ? 'TEAM_LEAD' : 'EMPLOYEE'),
      ...p,
    });
  };
  const teacher = (
    gender: 'F' | 'M',
    cls: string,
    position: string,
    team: string,
    workload: number,
    start: string,
    lead = false,
  ) =>
    add(gender, {
      position,
      workload,
      contractType: 'PERMANENT',
      contractStart: start,
      isTeacher: true,
      timeTracking: false,
      classes: [cls],
      team,
      teamLead: lead,
    });

  // Class leads + co-teachers for the new classes (existing classes keep the
  // base-seed teachers, and get one extra co-teacher / assistant each).
  teacher(
    'F',
    'Kindergarten A',
    'Klassenleitung Kindergarten',
    'Team Kinderhaus & Kindergarten',
    100,
    '2016-08-01',
    true,
  );
  teacher(
    'M',
    'Kindergarten B',
    'Klassenleitung Kindergarten',
    'Team Kinderhaus & Kindergarten',
    90,
    '2019-08-01',
  );
  teacher(
    'F',
    'Kinderhaus 1',
    'Pädagogin Kinderhaus',
    'Team Kinderhaus & Kindergarten',
    80,
    '2021-08-01',
  );
  teacher(
    'F',
    'Kinderhaus 2',
    'Pädagogin Kinderhaus',
    'Team Kinderhaus & Kindergarten',
    60,
    '2022-02-01',
  );
  teacher(
    'F',
    'Unterstufe A',
    'Klassenleitung Unterstufe',
    'Team Unterstufe',
    100,
    '2012-08-01',
    true,
  );
  teacher(
    'M',
    'Unterstufe B',
    'Klassenleitung Unterstufe',
    'Team Unterstufe',
    100,
    '2018-08-01',
  );
  teacher(
    'F',
    'Unterstufe C',
    'Klassenleitung Unterstufe',
    'Team Unterstufe',
    90,
    '2020-08-01',
  );
  teacher(
    'F',
    'Mittelstufe A',
    'Klassenleitung Mittelstufe',
    'Team Mittelstufe',
    100,
    '2014-08-01',
    true,
  );
  teacher(
    'M',
    'Mittelstufe B',
    'Klassenleitung Mittelstufe',
    'Team Mittelstufe',
    100,
    '2017-08-01',
  );
  teacher(
    'M',
    'Oberstufe B',
    'Klassenleitung Oberstufe',
    'Team Oberstufe',
    100,
    '2015-08-01',
    true,
  );
  // Co-teachers (Lehrpersonen)
  teacher(
    'F',
    'Kindergarten A',
    'Lehrperson Kindergarten',
    'Team Kinderhaus & Kindergarten',
    60,
    '2023-08-01',
  );
  teacher(
    'F',
    'Kindergarten B',
    'Lehrperson Kindergarten',
    'Team Kinderhaus & Kindergarten',
    50,
    '2024-08-01',
  );
  teacher(
    'M',
    'Unterstufe A',
    'Lehrperson Unterstufe',
    'Team Unterstufe',
    80,
    '2022-08-01',
  );
  teacher(
    'F',
    'Unterstufe B',
    'Lehrperson Unterstufe',
    'Team Unterstufe',
    70,
    '2021-08-01',
  );
  teacher(
    'F',
    'Unterstufe C',
    'Lehrperson Unterstufe',
    'Team Unterstufe',
    60,
    '2024-08-01',
  );
  teacher(
    'M',
    'Mittelstufe A',
    'Lehrperson Mittelstufe',
    'Team Mittelstufe',
    80,
    '2020-08-01',
  );
  teacher(
    'F',
    'Mittelstufe B',
    'Lehrperson Mittelstufe',
    'Team Mittelstufe',
    70,
    '2023-02-01',
  );
  teacher(
    'F',
    'Klasse OA',
    'Lehrperson Oberstufe',
    'Team Oberstufe',
    80,
    '2019-08-01',
  );
  teacher(
    'M',
    'Oberstufe B',
    'Lehrperson Oberstufe',
    'Team Oberstufe',
    60,
    '2025-08-01',
  );
  // Assistants (time tracking on — hourly-ish support roles)
  for (const [g, cls, team] of [
    ['F', 'Kinderhaus 1', 'Team Kinderhaus & Kindergarten'],
    ['F', 'Kinderhaus 2', 'Team Kinderhaus & Kindergarten'],
    ['F', 'Kindergarten A', 'Team Kinderhaus & Kindergarten'],
    ['M', 'Unterstufe A', 'Team Unterstufe'],
    ['F', 'Unterstufe C', 'Team Unterstufe'],
    ['F', 'Mittelstufe A', 'Team Mittelstufe'],
  ] as const) {
    add(g, {
      position: 'Assistenz',
      workload: 50,
      contractType: 'PERMANENT',
      contractStart: '2023-08-01',
      isTeacher: true,
      timeTracking: true,
      classes: [cls],
      team,
    });
  }
  // Specialist teachers (several classes)
  const specialists: [string, 'F' | 'M', string[], number][] = [
    [
      'Fachlehrperson Musik',
      'F',
      [
        'Unterstufe A',
        'Unterstufe B',
        'Unterstufe C',
        'Mittelstufe A',
        'Mittelstufe B',
      ],
      40,
    ],
    [
      'Fachlehrperson Sport',
      'M',
      [
        'Unterstufe A',
        'Unterstufe B',
        'Unterstufe C',
        'Mittelstufe A',
        'Mittelstufe B',
        'Klasse OA',
        'Oberstufe B',
      ],
      60,
    ],
    [
      'Fachlehrperson Englisch',
      'F',
      ['Mittelstufe A', 'Mittelstufe B', 'Klasse OA', 'Oberstufe B'],
      50,
    ],
    [
      'Fachlehrperson Französisch',
      'F',
      ['Mittelstufe A', 'Mittelstufe B', 'Klasse OA', 'Oberstufe B'],
      40,
    ],
    [
      'Fachlehrperson Werken / Gestalten',
      'M',
      ['Unterstufe A', 'Unterstufe B', 'Mittelstufe A', 'Klasse OA'],
      50,
    ],
    [
      'Schulische Heilpädagogin',
      'F',
      ['Unterstufe B', 'Mittelstufe B', 'Klasse PA'],
      60,
    ],
  ];
  for (const [position, g, classes, workload] of specialists) {
    add(g, {
      position,
      workload,
      contractType: workload <= 40 ? 'HOURLY' : 'PERMANENT',
      contractStart: '2021-08-01',
      isTeacher: true,
      timeTracking: false,
      classes,
      team: 'Fachlehrpersonen',
    });
  }
  // Leadership + office
  add('M', {
    position: 'Stv. Schulleitung',
    workload: 80,
    contractType: 'PERMANENT',
    contractStart: '2013-08-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Administration',
    roleCode: 'ORG_ADMIN',
  });
  add('F', {
    position: 'Sekretariat / Empfang',
    workload: 50,
    contractType: 'PERMANENT',
    contractStart: '2022-01-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Administration',
    roleCode: 'OFFICE',
  });
  add('M', {
    position: 'IT & Infrastruktur',
    workload: 40,
    contractType: 'PERMANENT',
    contractStart: '2024-03-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Administration',
  });
  // Facility + kitchen
  add('M', {
    position: 'Hauswart-Stv.',
    workload: 60,
    contractType: 'PERMANENT',
    contractStart: '2020-05-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Hausdienst & Küche',
    teamLead: true,
  });
  add('F', {
    position: 'Reinigung',
    workload: 40,
    contractType: 'HOURLY',
    contractStart: '2019-09-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Hausdienst & Küche',
  });
  add('M', {
    position: 'Koch Mittagstisch',
    workload: 70,
    contractType: 'PERMANENT',
    contractStart: '2018-08-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Hausdienst & Küche',
  });
  add('F', {
    position: 'Küchenhilfe',
    workload: 40,
    contractType: 'HOURLY',
    contractStart: '2023-08-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Hausdienst & Küche',
  });
  add('F', {
    position: 'Küchenhilfe',
    workload: 30,
    contractType: 'HOURLY',
    contractStart: '2025-01-06',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Hausdienst & Küche',
  });
  // After-school care (Hort)
  add('F', {
    position: 'Leitung Betreuung / Hort',
    workload: 80,
    contractType: 'PERMANENT',
    contractStart: '2017-08-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Betreuung / Hort',
    teamLead: true,
  });
  add('M', {
    position: 'Betreuungsperson Hort',
    workload: 50,
    contractType: 'PERMANENT',
    contractStart: '2022-08-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Betreuung / Hort',
  });
  add('F', {
    position: 'Betreuungsperson Hort (befristet)',
    workload: 40,
    contractType: 'TEMPORARY',
    contractStart: '2025-08-01',
    isTeacher: false,
    timeTracking: true,
    classes: [],
    team: 'Betreuung / Hort',
  });
  add('F', {
    position: 'Praktikantin Kinderhaus',
    workload: 100,
    contractType: 'INTERNSHIP',
    contractStart: '2025-08-01',
    isTeacher: true,
    timeTracking: true,
    classes: ['Kinderhaus 1'],
    team: 'Team Kinderhaus & Kindergarten',
  });
  return defs;
}

// 41 new staff + 9 base-seed users = 50.
export const LARGE_STAFF: StaffDef[] = buildStaff();

// ---------------------------------------------------------------------------
// Main entry: everything except the curriculum import
// ---------------------------------------------------------------------------

interface AdmissionsServiceLike {
  create: (
    input: unknown,
    orgId: string,
    actor: null,
  ) => Promise<{ id: string }>;
  finalizeEnrollment: (
    input: {
      applicationId: string;
      schoolClassId: string;
      enrollmentDate: string;
    },
    orgId: string,
    actor: null,
  ) => Promise<unknown>;
}

interface StudentCtx {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  enrolledAt: string;
  classId: string;
  cls: ClassDef;
  enrollmentId: string | null;
}

export async function seedLargeSchool(
  c: Client,
  ORG_ID: string,
  admissionsService: AdmissionsServiceLike,
  pwHash: string,
): Promise<void> {
  console.log('\n▶ Large-school extension');

  // -------- L1. Grade levels + classes --------
  for (const gl of GRADE_LEVELS) {
    await c.query(
      `INSERT INTO grade_levels (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            name, "sortOrder", color, organization_id)
       SELECT $1, 1, true, false, now(), now(), $2, $3, $4, $5
        WHERE NOT EXISTS (SELECT 1 FROM grade_levels WHERE organization_id = $5 AND name = $2)`,
      [randomUUID(), gl.name, gl.sortOrder, gl.color, ORG_ID],
    );
  }
  const { rows: glRows } = await c.query<{ id: string; name: string }>(
    `SELECT id, name FROM grade_levels WHERE organization_id = $1`,
    [ORG_ID],
  );
  const gradeLevelId = new Map(glRows.map((g) => [g.name, g.id]));

  let classesAdded = 0;
  for (const cls of LARGE_CLASSES) {
    const { rows: ex } = await c.query<{ id: string }>(
      `SELECT id FROM school_classes WHERE organization_id = $1 AND name = $2`,
      [ORG_ID, cls.name],
    );
    let classId = ex[0]?.id;
    if (!classId) {
      classId = randomUUID();
      await c.query(
        `INSERT INTO school_classes (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              name, color, "sortOrder", "maxCapacity", room, organization_id)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, $7)`,
        [
          classId,
          cls.name,
          cls.color,
          LARGE_CLASSES.indexOf(cls),
          cls.maxCapacity,
          cls.room,
          ORG_ID,
        ],
      );
      classesAdded++;
    }
    const glId = gradeLevelId.get(cls.gradeLevel);
    if (glId) {
      await c.query(
        `INSERT INTO school_class_grade_levels ("schoolClassesId", "gradeLevelsId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [classId, glId],
      );
    }
  }
  const { rows: classRows } = await c.query<{ id: string; name: string }>(
    `SELECT id, name FROM school_classes WHERE organization_id = $1`,
    [ORG_ID],
  );
  const classId = new Map(classRows.map((r) => [r.name, r.id]));
  console.log(
    `✓ Grade levels ensured (${GRADE_LEVELS.length}), classes (+${classesAdded}, total ${classRows.length})`,
  );

  // -------- L2. Staff --------
  const staffIds = new Map<string, StaffUserIds>();
  let staffAdded = 0;
  for (const s of LARGE_STAFF) {
    const ids = await ensureStaffUser(c, ORG_ID, s, pwHash);
    staffIds.set(s.email, ids);
    if (ids.created) staffAdded++;
    for (const clsName of s.classes) {
      const cid = classId.get(clsName);
      if (!cid) continue;
      await c.query(
        `INSERT INTO school_class_teachers (school_class_id, employee_id, organization_id)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [cid, ids.employeeId, ORG_ID],
      );
    }
  }
  console.log(`✓ Staff (+${staffAdded}, ${LARGE_STAFF.length} in extension)`);

  // Class lead per class → author of lesson records / notes.
  const { rows: classTeacherRows } = await c.query<{
    school_class_id: string;
    user_id: string;
    membership_id: string;
    email: string;
  }>(
    `SELECT sct.school_class_id, m.user_id, m.id AS membership_id, ue.email
       FROM school_class_teachers sct
       JOIN memberships m ON m.employee_id = sct.employee_id AND m.organization_id = sct.organization_id
       JOIN user_emails ue ON ue.id = m.user_email_id
      WHERE sct.organization_id = $1`,
    [ORG_ID],
  );
  const leadEmailByClass = new Map(
    LARGE_STAFF.filter((s) => s.position.startsWith('Klassenleitung')).flatMap(
      (s) => s.classes.map((cls) => [cls, s.email] as const),
    ),
  );
  const classLead = new Map<string, { userId: string; membershipId: string }>();
  for (const cls of LARGE_CLASSES) {
    const cid = classId.get(cls.name)!;
    const candidates = classTeacherRows.filter(
      (r) => r.school_class_id === cid,
    );
    const preferred =
      candidates.find((r) => r.email === leadEmailByClass.get(cls.name)) ??
      candidates[0];
    if (preferred) {
      classLead.set(cid, {
        userId: preferred.user_id,
        membershipId: preferred.membership_id,
      });
    }
  }

  // -------- L3. Students via admission → enrollment --------
  const students = await seedStudents(c, ORG_ID, admissionsService, classId);

  // -------- L4. Admission pipeline for next school year --------
  await seedAdmissionPipeline(
    c,
    ORG_ID,
    admissionsService,
    gradeLevelId,
    classId,
  );

  // -------- L5. Lesson records --------
  await seedLessonRecords(c, ORG_ID, students, classLead);

  // -------- L6. Student notes --------
  await seedStudentNotes(c, ORG_ID, students, classLead);

  // -------- L7. HR: contracts, absences, vacations, teams, time tracking ----
  await seedStaffHr(c, ORG_ID, staffIds);

  // -------- L8. Protocols --------
  await seedProtocols(c, ORG_ID, staffIds);
}

// ---------------------------------------------------------------------------
// L3. Students + families
// ---------------------------------------------------------------------------

interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  salutation: 'MR' | 'MRS' | 'DIVERSE' | 'NONE';
  roles: string[];
  occupation?: string;
  sortOrder: number;
}

function buildFamilyContacts(key: string, lastName: string): ContactInput[] {
  const contacts: ContactInput[] = [];
  const constellation = pickW(key, 'fam', [
    ['TWO_PARENTS', 68],
    ['SINGLE_MOTHER', 12],
    ['SINGLE_FATHER', 3],
    ['MOTHER_STEPFATHER', 6],
    ['FATHER_STEPMOTHER', 3],
    ['TWO_MOTHERS', 2],
    ['GUARDIAN', 2],
    ['SEPARATED', 4],
  ] as const);
  const phone = (salt: string) =>
    `+41 ${pick(key, salt + 'p', ['76', '77', '78', '79'])} ${rInt(key, salt + '1', 100, 999)} ${rInt(key, salt + '2', 10, 99)} ${rInt(key, salt + '3', 10, 99)}`;
  const email = (first: string, last: string, salt: string) =>
    `${slugify(first)}.${slugify(last)}${rInt(key, salt, 1, 99)}@${pick(key, salt + 'd', ['example.ch', 'example.com', 'mail.example', 'bluewin.example', 'gmx.example'])}`;
  const mother = (last = lastName, salt = 'm') => {
    const first = pick(key, salt + 'f', WOMEN);
    contacts.push({
      firstName: first,
      lastName: last,
      email: email(first, last, salt + 'e'),
      phone: phone(salt),
      salutation: 'MRS',
      roles: ['MOTHER'],
      occupation: pick(key, salt + 'o', OCCUPATIONS),
      sortOrder: contacts.length,
    });
  };
  const father = (last = lastName, salt = 'f') => {
    const first = pick(key, salt + 'f', MEN);
    contacts.push({
      firstName: first,
      lastName: last,
      email: email(first, last, salt + 'e'),
      phone: phone(salt),
      salutation: 'MR',
      roles: ['FATHER'],
      occupation: pick(key, salt + 'o', OCCUPATIONS),
      sortOrder: contacts.length,
    });
  };
  const other = (
    roles: string[],
    gender: 'F' | 'M',
    last: string,
    salt: string,
    withEmail = false,
  ) => {
    const first =
      gender === 'F'
        ? pick(key, salt + 'f', WOMEN)
        : pick(key, salt + 'f', MEN);
    contacts.push({
      firstName: first,
      lastName: last,
      email: withEmail ? email(first, last, salt + 'e') : undefined,
      phone: phone(salt),
      salutation: gender === 'F' ? 'MRS' : 'MR',
      roles,
      sortOrder: contacts.length,
    });
  };
  const otherLast = pick(key, 'ol', LAST_NAMES);
  switch (constellation) {
    case 'TWO_PARENTS':
      mother();
      father();
      break;
    case 'SINGLE_MOTHER':
      mother();
      break;
    case 'SINGLE_FATHER':
      father();
      break;
    case 'MOTHER_STEPFATHER':
      mother();
      other(['STEP_FATHER'], 'M', otherLast, 'sf', true);
      break;
    case 'FATHER_STEPMOTHER':
      father();
      other(['STEP_MOTHER'], 'F', otherLast, 'sm', true);
      break;
    case 'TWO_MOTHERS':
      mother();
      mother(otherLast, 'm2');
      break;
    case 'GUARDIAN':
      other(
        ['LEGAL_GUARDIAN'],
        rnd(key, 'gg') < 0.5 ? 'F' : 'M',
        otherLast,
        'lg',
        true,
      );
      break;
    case 'SEPARATED':
      mother();
      father(rnd(key, 'sepl') < 0.3 ? otherLast : lastName, 'f');
      break;
  }
  // Additional caregivers
  const extra = rnd(key, 'extra');
  if (extra < 0.22) {
    const grandLast = rnd(key, 'gl') < 0.5 ? lastName : otherLast;
    other(['GRANDMOTHER'], 'F', grandLast, 'gm');
    if (rnd(key, 'gf') < 0.5) other(['GRANDFATHER'], 'M', grandLast, 'gf');
  } else if (extra < 0.31) {
    other(['NANNY'], 'F', pick(key, 'nl', LAST_NAMES), 'nn', true);
  } else if (extra < 0.36) {
    other(['AUNT_UNCLE'], rnd(key, 'au') < 0.6 ? 'F' : 'M', otherLast, 'au');
  }
  return contacts;
}

async function seedStudents(
  c: Client,
  ORG_ID: string,
  admissionsService: AdmissionsServiceLike,
  classId: Map<string, string>,
): Promise<StudentCtx[]> {
  const result: StudentCtx[] = [];
  let created = 0;
  let siblings = 0;
  // Families generated in this run that can take a sibling (key → info).
  const openFamilies: { familyName: string; lastName: string }[] = [];

  for (const cls of LARGE_CLASSES) {
    const cid = classId.get(cls.name);
    if (!cid) continue;
    const { rows: existing } = await c.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM school_class_enrollments
        WHERE school_class_id = $1 AND organization_id = $2 AND left_at IS NULL`,
      [cid, ORG_ID],
    );
    let missing = cls.target - Number(existing[0].n);

    // Deterministic per class: seat index 0..target-1 → stable identity even
    // when existing rosters differ (we only *create* the missing tail, which
    // makes re-runs a no-op because names/dob are re-derived from the seat).
    for (let seat = 0; seat < cls.target && missing > 0; seat++) {
      const key = `stu:${cls.name}:${seat}`;
      const gender = rnd(key, 'g') < 0.5 ? 'FEMALE' : 'MALE';
      const firstName =
        gender === 'FEMALE'
          ? pick(key, 'fn', GIRL_NAMES)
          : pick(key, 'fn', BOY_NAMES);

      // Sibling? ~14% of students join an already-created family.
      let familyName: string;
      let lastName: string;
      let contacts: ContactInput[] | undefined;
      const sib = openFamilies.length > 0 && rnd(key, 'sib') < 0.14;
      if (sib) {
        const fam = pick(key, 'sibfam', openFamilies);
        familyName = fam.familyName;
        lastName = fam.lastName;
      } else {
        lastName = pick(key, 'ln', LAST_NAMES);
        familyName = `Familie ${lastName}`;
        // Family names are unique per org; suffix on collision keeps two
        // unrelated "Familie Müller" apart.
        const { rows: famClash } = await c.query(
          `SELECT 1 FROM families WHERE organization_id = $1 AND name = $2`,
          [ORG_ID, familyName],
        );
        const { rows: famOwn } = await c.query(
          `SELECT 1 FROM students s
             JOIN admission_applications a ON a.id = s.admission_application_id
             JOIN families f ON f.id = a.family_id
            WHERE s.organization_id = $1 AND f.name = $2 AND s."lastName" = $3
              AND s.notes LIKE 'seed-large:%'`,
          [ORG_ID, familyName, lastName],
        );
        if (famClash[0] && !famOwn[0]) {
          familyName = `Familie ${lastName} (${pick(key, 'city', CITIES)})`;
        }
        contacts = buildFamilyContacts(key, lastName);
      }

      // Age band → date of birth relative to school-year start.
      const ageYears = rInt(key, 'age', cls.ages[0], cls.ages[1] - 1);
      const dobDaysBack = ageYears * 365 + rInt(key, 'agedays', 0, 364);
      const dob = addDays(SCHOOL_YEAR_START, -dobDaysBack);
      // Joined the school 0..N years ago depending on age (Kinderhaus kids
      // are new, Oberstufe kids have often been here for years).
      const yearsAtSchool = Math.min(
        rInt(key, 'yrs', 0, 3),
        Math.max(0, ageYears - 3),
      );
      const enrolledAt = addDays(SCHOOL_YEAR_START, -365 * yearsAtSchool);

      const { rows: dup } = await c.query<{ id: string }>(
        `SELECT id FROM students
          WHERE organization_id = $1 AND "firstName" = $2 AND "lastName" = $3 AND "dateOfBirth" = $4`,
        [ORG_ID, firstName, lastName, dob],
      );
      if (dup[0]) continue; // already seeded in a previous run

      let familyId: string | undefined;
      const { rows: famRow } = await c.query<{ id: string }>(
        `SELECT id FROM families WHERE organization_id = $1 AND name = $2`,
        [ORG_ID, familyName],
      );
      familyId = famRow[0]?.id;

      const nationalities = pickW(key, 'nat', NATIONALITY_MIX);
      const firstLanguages = [
        ...new Set(nationalities.map((n) => LANG_BY_NAT[n] ?? 'Deutsch')),
      ];
      const familyLanguages =
        rnd(key, 'famlang') < 0.25 && !firstLanguages.includes('Englisch')
          ? [...firstLanguages, 'Englisch']
          : firstLanguages;

      const application = await admissionsService.create(
        {
          ...(familyId ? { familyId } : { familyName }),
          childFirstName: firstName,
          childLastName: lastName,
          childDateOfBirth: dob,
          childGender: gender,
          childNotes: `seed-large:${cls.name}:${seat}`,
          contactPersons: familyId ? undefined : contacts,
        },
        ORG_ID,
        null,
      );
      await admissionsService.finalizeEnrollment(
        {
          applicationId: application.id,
          schoolClassId: cid,
          enrollmentDate: enrolledAt,
        },
        ORG_ID,
        null,
      );
      const { rows: stu } = await c.query<{ id: string }>(
        `SELECT id FROM students WHERE admission_application_id = $1`,
        [application.id],
      );
      const studentId = stu[0]?.id;
      if (!studentId) continue;

      await c.query(
        `UPDATE students
            SET notes = $2, nationalities = $3, first_languages = $4, family_languages = $5,
                place_of_birth = $6, preferred_name = $7
          WHERE id = $1`,
        [
          studentId,
          `seed-large:${cls.name}:${seat}`,
          nationalities,
          firstLanguages,
          familyLanguages,
          pick(key, 'pob', CITIES),
          rnd(key, 'pref') < 0.08
            ? firstName.slice(0, Math.max(3, firstName.length - 1))
            : null,
        ],
      );
      // Caregiver flags the admission mirror doesn't know about.
      await c.query(
        `UPDATE student_contact_persons scp
            SET lives_with_student = (scp.relationship_type IN ('MOTHER','FATHER','STEP_FATHER','STEP_MOTHER','LEGAL_GUARDIAN')),
                emergency_priority = CASE
                  WHEN scp.relationship_type IN ('MOTHER','LEGAL_GUARDIAN') THEN 1
                  WHEN scp.relationship_type IN ('FATHER','STEP_FATHER','STEP_MOTHER') THEN 2
                  ELSE 3 END,
                is_pickup_authorized = scp.relationship_type <> 'AUNT_UNCLE'
          WHERE scp.student_id = $1`,
        [studentId],
      );

      if (!sib && !familyId && rnd(key, 'open') < 0.6) {
        openFamilies.push({ familyName, lastName });
      }
      if (sib) siblings++;
      created++;
      missing--;
    }
  }
  console.log(
    `✓ Students enrolled (+${created}, thereof ${siblings} siblings)`,
  );

  // Full roster context (all active enrollments, base seed included).
  const { rows } = await c.query<{
    id: string;
    firstName: string;
    lastName: string;
    dob: string;
    enrolledAt: string;
    classId: string;
    className: string;
    enrollmentId: string;
  }>(
    `SELECT s.id, s."firstName", s."lastName", to_char(s."dateOfBirth", 'YYYY-MM-DD') AS dob,
            to_char(e.enrolled_at, 'YYYY-MM-DD') AS "enrolledAt",
            e.school_class_id AS "classId", sc.name AS "className", e.id AS "enrollmentId"
       FROM students s
       JOIN school_class_enrollments e ON e.student_id = s.id AND e.left_at IS NULL
       JOIN school_classes sc ON sc.id = e.school_class_id
      WHERE s.organization_id = $1 AND s."isArchived" = false`,
    [ORG_ID],
  );
  for (const r of rows) {
    const cls = LARGE_CLASSES.find((k) => k.name === r.className);
    if (!cls) continue;
    result.push({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      dob: r.dob ?? addDays(SCHOOL_YEAR_START, -365 * cls.ages[0]),
      enrolledAt: r.enrolledAt ?? SCHOOL_YEAR_START,
      classId: r.classId,
      cls,
      enrollmentId: r.enrollmentId,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// L4. Admission pipeline (next school year)
// ---------------------------------------------------------------------------

async function seedAdmissionPipeline(
  c: Client,
  ORG_ID: string,
  admissionsService: AdmissionsServiceLike,
  gradeLevelId: Map<string, string>,
  classId: Map<string, string>,
) {
  const { rows: stageRows } = await c.query<{ id: string; slug: string }>(
    `SELECT id, slug FROM admission_stages WHERE organization_id = $1`,
    [ORG_ID],
  );
  const stage = new Map(stageRows.map((r) => [r.slug, r.id]));
  const { rows: sourceRows } = await c.query<{
    id: string;
    system_key: string;
  }>(
    `SELECT id, system_key FROM admission_sources WHERE organization_id = $1`,
    [ORG_ID],
  );
  const source = new Map(sourceRows.map((r) => [r.system_key, r.id]));

  const PLAN: [string, number][] = [
    ['lead', 6],
    ['anfrage', 7],
    ['hospitation', 5],
    ['aufnahmegespraech', 4],
    ['vertrag', 3],
    ['abgelehnt', 3],
  ];
  let added = 0;
  let i = 0;
  for (const [slug, count] of PLAN) {
    const stageId = stage.get(slug);
    if (!stageId) continue;
    for (let k = 0; k < count; k++, i++) {
      const key = `adm:${slug}:${k}`;
      const gender = rnd(key, 'g') < 0.5 ? 'FEMALE' : 'MALE';
      const firstName =
        gender === 'FEMALE'
          ? pick(key, 'fn', GIRL_NAMES)
          : pick(key, 'fn', BOY_NAMES);
      const lastName = pick(key, 'ln', LAST_NAMES);
      const familyName = `Familie ${lastName} (Aufnahme 2026)`;
      const { rows: dup } = await c.query(
        `SELECT 1 FROM admission_applications a JOIN families f ON f.id = a.family_id
          WHERE a.organization_id = $1 AND f.name = $2 AND a.child_first_name = $3`,
        [ORG_ID, familyName, firstName],
      );
      if (dup[0]) continue;

      const age = pickW(key, 'age', [
        [3, 25],
        [4, 25],
        [5, 15],
        [6, 15],
        [7, 5],
        [9, 5],
        [10, 5],
        [12, 5],
      ]);
      const dob = addDays('2026-08-17', -(age * 365 + rInt(key, 'ad', 0, 364)));
      const glName =
        age <= 4
          ? 'Vorschule'
          : age <= 6
            ? 'Kindergarten'
            : age <= 9
              ? 'Unterstufe'
              : age <= 12
                ? 'Mittelstufe'
                : 'Oberstufe';
      const desiredClass =
        glName === 'Vorschule'
          ? 'Kinderhaus 1'
          : glName === 'Kindergarten'
            ? 'Kindergarten A'
            : glName === 'Unterstufe'
              ? 'Unterstufe A'
              : glName === 'Mittelstufe'
                ? 'Mittelstufe A'
                : 'Oberstufe B';
      const sourceKey = pickW(key, 'src', [
        ['PUBLIC_FORM', 40],
        ['REFERRAL', 25],
        ['OPEN_DAY', 20],
        ['MANUAL', 10],
        ['OTHER', 5],
      ]);
      const { rows: famRow } = await c.query<{ id: string }>(
        `SELECT id FROM families WHERE organization_id = $1 AND name = $2`,
        [ORG_ID, familyName],
      );
      const notes = pick(key, 'note', [
        'Familie zieht im Sommer nach Zürich, Geschwister bereits angemeldet.',
        'Kind besucht aktuell eine Spielgruppe, Eltern wünschen Montessori-Pädagogik.',
        'Kontakt über Tag der offenen Tür, Interesse an Hort-Betreuung.',
        'Empfehlung durch Familie aus Mittelstufe B.',
        'Eltern wünschen zweisprachiges Umfeld (DE/EN).',
        'Wechsel von öffentlicher Schule, Klassenwechsel per Schuljahr 2026/27.',
        'Bevorzugt Kinderhaus 2 wegen Geschwisterkind.',
        '',
      ]);
      const application = await admissionsService.create(
        {
          ...(famRow[0] ? { familyId: famRow[0].id } : { familyName }),
          admissionStageId: stageId,
          childFirstName: firstName,
          childLastName: lastName,
          childDateOfBirth: dob,
          childGender: gender,
          childNotes: notes || undefined,
          assignedGradeLevelId: gradeLevelId.get(glName),
          desiredSchoolClassId: classId.get(desiredClass),
          desiredEnrollmentDate: '2026-08-17',
          admissionSourceId: source.get(sourceKey),
          contactPersons: famRow[0]
            ? undefined
            : buildFamilyContacts(key, lastName),
        },
        ORG_ID,
        null,
      );
      // Stage age spread + rejected status for the "Abgelehnt" column.
      const days = rInt(
        key,
        'days',
        slug === 'lead' ? 0 : 2,
        slug === 'vertrag' ? 12 : 45,
      );
      await c.query(
        `UPDATE admission_applications
            SET stage_entered_at = now() - ($2 || ' days')::interval,
                "createdAt" = now() - ($2 || ' days')::interval - interval '10 days',
                source = $3::admission_applications_source_enum,
                status = CASE WHEN $4 THEN 'REJECTED'::admission_applications_status_enum ELSE status END,
                rejection_reason = CASE WHEN $4 THEN $5 ELSE rejection_reason END,
                position = $6
          WHERE id = $1`,
        [
          application.id,
          String(days),
          sourceKey,
          slug === 'abgelehnt',
          pick(key, 'rej', [
            'Kein freier Platz in der gewünschten Stufe.',
            'Familie hat sich für eine andere Schule entschieden.',
            'Wohnort zu weit entfernt, kein Schulbus.',
          ]),
          100 + k,
        ],
      );
      added++;
    }
  }
  console.log(`✓ Admission pipeline 2026/27 (+${added} applications)`);
}

// ---------------------------------------------------------------------------
// L5. Lesson records (record keeping / Fortschritte)
// ---------------------------------------------------------------------------

interface LessonRow {
  id: string;
  areaId: string;
  areaName: string;
}

async function lessonsForLevel(
  c: Client,
  ORG_ID: string,
  levelSlug: string,
): Promise<LessonRow[]> {
  const { rows } = await c.query<LessonRow>(
    `WITH RECURSIVE tree AS (
        SELECT n.id, n.parent_id, n.node_type, n.id AS area_id,
               ARRAY[n.position] AS path
          FROM curriculum_nodes n
          JOIN curriculum_levels l ON l.id = n.level_id
         WHERE n.organization_id = $1 AND l.slug = $2 AND n.parent_id IS NULL
        UNION ALL
        SELECT n.id, n.parent_id, n.node_type, t.area_id, t.path || n.position
          FROM curriculum_nodes n
          JOIN tree t ON n.parent_id = t.id
     )
     SELECT t.id, t.area_id AS "areaId", tr.name AS "areaName"
       FROM tree t
       JOIN curriculum_node_translations tr ON tr.curriculum_node_id = t.area_id AND tr.locale = 'DE'
      WHERE t.node_type = 'LESSON'
      ORDER BY t.path`,
    [ORG_ID, levelSlug],
  );
  return rows;
}

interface RecordRow {
  studentId: string;
  lessonId: string;
  recordedAt: string;
  status: string;
  recordedBy: string | null;
  enrollmentId: string | null;
  engagement: string | null;
  difficulty: string | null;
  socialForm: string | null;
  selfAssessment: string | null;
  persistence: string | null;
  concentration: string | null;
  selfConfidence: string | null;
  duration: number | null;
  note: string | null;
}

function axes(key: string, status: string): Partial<RecordRow> {
  const on = (salt: string, p: number) => rnd(key, salt) < p;
  const struggling = status === 'NEEDS_MORE';
  return {
    engagement: on('eng', 0.8)
      ? pickW(key, 'engv', [
          ['FOCUSED', struggling ? 20 : 45],
          ['INTERESTED', 30],
          ['MECHANICAL', struggling ? 30 : 15],
          ['RESISTANT', struggling ? 20 : 5],
        ])
      : null,
    difficulty: on('dif', 0.65)
      ? pickW(key, 'difv', [
          ['JUST_RIGHT', struggling ? 30 : 65],
          ['TOO_EASY', struggling ? 5 : 20],
          ['TOO_HARD', struggling ? 65 : 15],
        ])
      : null,
    socialForm: on('soc', 0.55)
      ? pickW(key, 'socv', [
          ['ALONE', 50],
          ['WITH_PARTNER', 20],
          ['SMALL_GROUP', 15],
          ['WITH_GUIDE', 15],
        ])
      : null,
    selfAssessment: on('sa', 0.32)
      ? pickW(key, 'sav', [
          ['UNDERSTOOD', struggling ? 20 : 60],
          ['PARTIAL', 30],
          ['NEEDS_REPEAT', struggling ? 50 : 10],
        ])
      : null,
    persistence: on('per', 0.58)
      ? pickW(key, 'perv', [
          ['PERSISTS', struggling ? 35 : 65],
          ['SEEKS_HELP', 25],
          ['GIVES_UP', struggling ? 40 : 10],
        ])
      : null,
    concentration: on('con', 0.62)
      ? pickW(key, 'conv', [
          ['FLOW', struggling ? 25 : 55],
          ['PARTIAL_FOCUS', 30],
          ['INTERRUPTED', struggling ? 45 : 15],
        ])
      : null,
    selfConfidence: on('sc', 0.48)
      ? pickW(key, 'scv', [
          ['CONFIDENT', struggling ? 25 : 60],
          ['TENTATIVE', 30],
          ['INSECURE', struggling ? 45 : 10],
        ])
      : null,
    duration: on('dur', 0.7) ? rInt(key, 'durv', 10, 50) : null,
  };
}

const NOTE_SNIPPETS = [
  'Sehr konzentriert gearbeitet, Material selbständig geholt.',
  'Wiederholung nötig — nächste Woche nochmals zeigen.',
  'Hat Partnerin die Arbeit erklärt.',
  'Braucht noch Begleitung beim Aufräumen.',
  'Grosse Freude am Material, mehrfach wiederholt.',
  'Abgelenkt durch Gruppe nebenan.',
  'Fehlerkontrolle selbst durchgeführt.',
  'Bittet um weiterführende Arbeit.',
];

async function seedLessonRecords(
  c: Client,
  ORG_ID: string,
  students: StudentCtx[],
  classLead: Map<string, { userId: string; membershipId: string }>,
) {
  const lessonsByLevel = new Map<string, LessonRow[]>();
  for (const slug of [
    'early-childhood',
    'lower-elementary',
    'upper-elementary',
  ]) {
    lessonsByLevel.set(slug, await lessonsForLevel(c, ORG_ID, slug));
  }
  if ([...lessonsByLevel.values()].every((l) => l.length === 0)) {
    console.warn('⚠ No curriculum lessons found — skipping lesson records');
    return;
  }

  const { rows: withRecords } = await c.query<{ student_id: string }>(
    `SELECT DISTINCT student_id FROM lesson_records WHERE organization_id = $1`,
    [ORG_ID],
  );
  const skip = new Set(withRecords.map((r) => r.student_id));

  const buffer: RecordRow[] = [];
  let studentsDone = 0;
  const flush = async () => {
    if (buffer.length === 0) return;
    const col = <K extends keyof RecordRow>(k: K) => buffer.map((r) => r[k]);
    await c.query(
      `INSERT INTO lesson_records (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            student_id, lesson_id, recorded_at, status, organization_id, recorded_by_id,
            school_class_enrollment_id, engagement, difficulty, social_form, self_assessment,
            persistence, concentration, self_confidence, duration_minutes, note)
       SELECT gen_random_uuid(), 1, true, false, v.recorded_at::timestamptz, v.recorded_at::timestamptz,
              v.student_id, v.lesson_id, v.recorded_at::timestamptz, v.status::lesson_records_status_enum, $1,
              v.recorded_by, v.enrollment_id,
              v.engagement::lesson_records_engagement_enum,
              v.difficulty::lesson_records_difficulty_enum,
              v.social_form::lesson_records_social_form_enum,
              v.self_assessment::lesson_records_self_assessment_enum,
              v.persistence::lesson_records_persistence_enum,
              v.concentration::lesson_records_concentration_enum,
              v.self_confidence::lesson_records_self_confidence_enum,
              v.duration, v.note
         FROM unnest($2::uuid[], $3::uuid[], $4::text[], $5::text[], $6::uuid[], $7::uuid[],
                     $8::text[], $9::text[], $10::text[], $11::text[], $12::text[], $13::text[],
                     $14::text[], $15::int[], $16::text[])
           AS v(student_id, lesson_id, recorded_at, status, recorded_by, enrollment_id,
                engagement, difficulty, social_form, self_assessment, persistence,
                concentration, self_confidence, duration, note)`,
      [
        ORG_ID,
        col('studentId'),
        col('lessonId'),
        col('recordedAt'),
        col('status'),
        col('recordedBy'),
        col('enrollmentId'),
        col('engagement'),
        col('difficulty'),
        col('socialForm'),
        col('selfAssessment'),
        col('persistence'),
        col('concentration'),
        col('selfConfidence'),
        col('duration'),
        col('note'),
      ],
    );
    buffer.length = 0;
  };

  let total = 0;
  for (const s of students) {
    if (skip.has(s.id)) continue;
    const lessons = lessonsByLevel.get(s.cls.curriculumLevel) ?? [];
    if (lessons.length === 0) continue;
    const key = `lr:${s.id}`;
    const lead = classLead.get(s.classId);

    // Progress through the level: position of the child's age inside the
    // level's age band (+ per-child ability jitter), then per-area variance.
    const ageAtStart = daysBetween(s.dob, SCHOOL_YEAR_START) / 365;
    const [minAge, maxAge] = s.cls.ages;
    const band = Math.min(
      1,
      Math.max(0, (ageAtStart - minAge) / (maxAge - minAge)),
    );
    const ability = (rnd(key, 'ability') - 0.5) * 0.3;
    const base = Math.min(0.92, Math.max(0.08, 0.12 + band * 0.7 + ability));

    // History window: since enrollment, but at most ~2.5 years back.
    const historyStart =
      daysBetween(s.enrolledAt, TODAY) > 900
        ? addDays(TODAY, -900)
        : s.enrolledAt;
    const historyDays = Math.max(60, daysBetween(historyStart, TODAY) - 7);

    // Group lessons by area preserving order.
    const areas = new Map<string, LessonRow[]>();
    for (const l of lessons) {
      if (!areas.has(l.areaId)) areas.set(l.areaId, []);
      areas.get(l.areaId)!.push(l);
    }
    const isYoungKiga = s.cls.level === 'KIGA' && ageAtStart < 4;
    for (const [areaId, areaLessons] of areas) {
      const areaKey = `${key}:${areaId}`;
      // Kinderhaus 3-year-olds barely touch Mathematik/Sprache/Kultur yet.
      const areaBias =
        isYoungKiga && !/Praktisch|Sinnes/.test(areaLessons[0].areaName)
          ? 0.15
          : 1;
      const frac = Math.min(
        0.97,
        Math.max(0.02, (base + (rnd(areaKey, 'var') - 0.5) * 0.3) * areaBias),
      );
      const mastered = Math.round(areaLessons.length * frac);
      const frontier = Math.min(
        areaLessons.length - mastered,
        rInt(areaKey, 'front', 2, 6),
      );

      for (let i = 0; i < mastered + frontier; i++) {
        const lesson = areaLessons[i];
        const lk = `${areaKey}:${lesson.id}`;
        // Mastered lessons are spread across the history window in order.
        const t = i / Math.max(1, mastered);
        const masteredDay = Math.round(t * historyDays * 0.92);
        const push = (dayOffset: number, status: string, withAxes: boolean) => {
          const recordedAt = addDays(
            historyStart,
            Math.min(historyDays, Math.max(0, dayOffset)),
          );
          const rk = `${lk}:${status}:${dayOffset}`;
          const hour = rInt(rk, 'h', 8, 15);
          const minute = rInt(rk, 'm', 0, 59);
          buffer.push({
            studentId: s.id,
            lessonId: lesson.id,
            recordedAt: `${recordedAt}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
            status,
            recordedBy: lead?.userId ?? null,
            enrollmentId: s.enrollmentId,
            engagement: null,
            difficulty: null,
            socialForm: null,
            selfAssessment: null,
            persistence: null,
            concentration: null,
            selfConfidence: null,
            duration: null,
            note:
              rnd(rk, 'note') < 0.06 ? pick(rk, 'notev', NOTE_SNIPPETS) : null,
            ...(withAxes ? axes(rk, status) : {}),
          });
        };

        if (i < mastered) {
          // Older history: mostly a single MASTERED record; the most recent
          // ~10 mastered lessons carry the full INTRODUCED→PRACTICED→MASTERED
          // transition so the Hattie views have something to show.
          const recent = i >= mastered - 10;
          if (recent) {
            const intro = masteredDay - rInt(lk, 'g1', 10, 30);
            push(intro, 'INTRODUCED', true);
            const practices = rInt(lk, 'np', 1, 3);
            for (let p = 0; p < practices; p++) {
              push(
                intro + rInt(`${lk}:${p}`, 'gp', 2, 12) * (p + 1),
                'PRACTICED',
                true,
              );
            }
            if (rnd(lk, 'nm') < 0.2)
              push(masteredDay - rInt(lk, 'gnm', 2, 6), 'NEEDS_MORE', true);
            push(masteredDay, 'MASTERED', true);
          } else {
            push(masteredDay, 'MASTERED', rnd(lk, 'ax') < 0.35);
          }
        } else {
          // Frontier: what the child is working on right now (last 6 weeks).
          const kind = pickW(lk, 'fk', [
            ['PRACTICED', 45],
            ['INTRODUCED', 30],
            ['NEEDS_MORE', 15],
            ['PLANNING', 10],
          ]);
          const recentBase = historyDays - rInt(lk, 'fd', 1, 42);
          if (kind === 'PLANNING') {
            push(recentBase, 'PLANNING', false);
          } else {
            push(recentBase - rInt(lk, 'fi', 5, 20), 'INTRODUCED', true);
            if (kind !== 'INTRODUCED') {
              const n = rInt(lk, 'fn', 1, 3);
              for (let p = 0; p < n; p++)
                push(
                  recentBase - rInt(`${lk}:${p}`, 'fpp', 0, 4) * p,
                  kind === 'NEEDS_MORE' && p === n - 1
                    ? 'NEEDS_MORE'
                    : 'PRACTICED',
                  true,
                );
            }
          }
        }
      }
    }
    studentsDone++;
    total += buffer.length;
    if (buffer.length >= 2000) await flush();
  }
  await flush();
  console.log(`✓ Lesson records (+${total} for ${studentsDone} students)`);
}

// ---------------------------------------------------------------------------
// L6. Student notes
// ---------------------------------------------------------------------------

const NOTE_TEMPLATES: {
  category: string;
  title: string;
  content: string;
  confidential?: boolean;
}[] = [
  {
    category: 'PARENT_CONTACT',
    title: 'Telefonat mit Mutter',
    content:
      'Mutter meldet, dass das Kind aktuell schlecht schläft. Wir beobachten die Konzentration in den Morgenstunden und melden uns in zwei Wochen zurück.',
  },
  {
    category: 'MEETING',
    title: 'Elterngespräch Standortbestimmung',
    content:
      'Standortgespräch mit beiden Eltern. Besprochen: Fortschritte in Mathematik und Sprache, nächste Schritte im Curriculum, Rolle der Selbstkontrolle. Eltern wünschen zusätzliche Leseförderung zu Hause.',
  },
  {
    category: 'ACADEMIC',
    title: 'Beobachtung Freiarbeit',
    content:
      'Wählt seit zwei Wochen überwiegend Arbeiten aus dem Bereich Sinnesmaterial; Mathematik wird gemieden. Nächste Woche gezielte Einführung des nächsten Materials anbieten.',
  },
  {
    category: 'BEHAVIOR',
    title: 'Konflikt in der Pause',
    content:
      'Auseinandersetzung mit einem Klassenkameraden um Spielmaterial. Gespräch mit beiden Kindern geführt, Lösung gemeinsam gefunden. Keine weiteren Massnahmen.',
  },
  {
    category: 'HEALTH',
    title: 'Allergie-Hinweis',
    content:
      'Eltern haben Nussallergie gemeldet. Küche informiert, Notfallset im Sekretariat hinterlegt.',
    confidential: true,
  },
  {
    category: 'GENERAL',
    title: 'Wechsel Betreuungszeiten',
    content:
      'Ab nächstem Monat Hort-Betreuung an Dienstagen und Donnerstagen bis 17:30 Uhr.',
  },
  {
    category: 'ACADEMIC',
    title: 'Lernfortschritt Sprache',
    content:
      'Liest jetzt flüssig kurze Texte, beginnt mit dem beweglichen Alphabet eigene Sätze zu schreiben. Grosse Motivation.',
  },
  {
    category: 'MEETING',
    title: 'Runder Tisch mit Heilpädagogin',
    content:
      'Austausch mit SHP und Eltern: Fördermassnahmen im Bereich Konzentration vereinbart, Überprüfung in drei Monaten.',
    confidential: true,
  },
  {
    category: 'PARENT_CONTACT',
    title: 'E-Mail von Vater',
    content:
      'Vater fragt nach Möglichkeiten für Instrumentalunterricht. Kontakt der Musiklehrperson weitergeleitet.',
  },
  {
    category: 'OTHER',
    title: 'Ausflug-Erlaubnis',
    content: 'Unterschriebene Erlaubnis für den Waldtag liegt vor.',
  },
];

async function seedStudentNotes(
  c: Client,
  ORG_ID: string,
  students: StudentCtx[],
  classLead: Map<string, { userId: string; membershipId: string }>,
) {
  let added = 0;
  for (const s of students) {
    const key = `note:${s.id}`;
    if (rnd(key, 'has') > 0.3) continue;
    const n = rInt(key, 'n', 1, 3);
    for (let i = 0; i < n; i++) {
      const tpl = pick(`${key}:${i}`, 't', NOTE_TEMPLATES);
      const date = addDays(
        SCHOOL_YEAR_START,
        rInt(
          `${key}:${i}`,
          'd',
          5,
          Math.max(6, daysBetween(SCHOOL_YEAR_START, TODAY)),
        ),
      );
      const { rowCount } = await c.query(
        `INSERT INTO student_notes (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              student_id, organization_id, author_membership_id, category, title, content, is_confidential, date)
         SELECT $1::uuid, 1, true, false, $9::date, $9::date, $2::uuid, $3::uuid, $4::uuid, $5::student_notes_category_enum, $6::text, $7::text, $8::boolean, $9::date
          WHERE NOT EXISTS (SELECT 1 FROM student_notes WHERE student_id = $2::uuid AND title = $6::text AND date = $9::date)`,
        [
          randomUUID(),
          s.id,
          ORG_ID,
          classLead.get(s.classId)?.membershipId ?? null,
          tpl.category,
          tpl.title,
          tpl.content,
          tpl.confidential ?? false,
          date,
        ],
      );
      added += rowCount ?? 0;
    }
  }
  console.log(`✓ Student notes (+${added})`);
}

// ---------------------------------------------------------------------------
// L7. Staff HR data
// ---------------------------------------------------------------------------

async function seedStaffHr(
  c: Client,
  ORG_ID: string,
  staffIds: Map<string, StaffUserIds>,
) {
  // Contracts
  let contracts = 0;
  for (const s of LARGE_STAFF) {
    const ids = staffIds.get(s.email);
    if (!ids) continue;
    const { rows: ex } = await c.query(
      `SELECT 1 FROM employee_contracts WHERE employee_id = $1 AND start_date = $2`,
      [ids.employeeId, s.contractStart],
    );
    if (ex[0]) continue;
    const endDate =
      s.contractType === 'TEMPORARY' || s.contractType === 'INTERNSHIP'
        ? '2026-07-31'
        : null;
    const weeklyHours = Math.round(((42 * s.workload) / 100) * 2) / 2;
    const salaryBase = s.isTeacher
      ? 8400
      : /Leitung/.test(s.position)
        ? 9200
        : 5600;
    await c.query(
      `INSERT INTO employee_contracts (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
            organization_id, employee_id, start_date, end_date, probation_end_date, contract_type, "position",
            workload_percent, weekly_hours, gross_salary, payment_interval, has_13th_salary, annual_vacation_days,
            hourly_rate)
       VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, $7::employee_contracts_contract_type_enum, $8,
               $9, $10, $11, $12::employee_contracts_payment_interval_enum, $13, $14, $15)`,
      [
        randomUUID(),
        ORG_ID,
        ids.employeeId,
        s.contractStart,
        endDate,
        addDays(s.contractStart, 90),
        s.contractType,
        s.position,
        s.workload,
        weeklyHours,
        s.contractType === 'HOURLY'
          ? null
          : Math.round(
              (salaryBase * s.workload) / 100 + rInt(s.email, 'sal', -400, 600),
            ),
        s.contractType === 'HOURLY' ? 'MONTHLY_X12' : 'MONTHLY_X13',
        s.contractType !== 'HOURLY',
        rInt(s.email, 'vac', 0, 1) === 0 ? 25 : 27,
        s.contractType === 'HOURLY' ? rInt(s.email, 'hr', 32, 48) : null,
      ],
    );
    contracts++;
  }
  console.log(`✓ Staff contracts (+${contracts})`);

  // Absences (all staff of the org, incl. base seed) + absence days
  const { rows: catRows } = await c.query<{ id: string; system_code: string }>(
    `SELECT id, system_code::text FROM employee_absence_categories WHERE organization_id = $1 AND system_code IS NOT NULL`,
    [ORG_ID],
  );
  const category = new Map(catRows.map((r) => [r.system_code, r.id]));
  const { rows: allStaff } = await c.query<{
    employee_id: string;
    membership_id: string;
    email: string;
  }>(
    `SELECT m.employee_id, m.id AS membership_id, ue.email
       FROM memberships m JOIN user_emails ue ON ue.id = m.user_email_id
      WHERE m.organization_id = $1 AND m.employee_id IS NOT NULL`,
    [ORG_ID],
  );
  let absences = 0;
  const yearDays = daysBetween(SCHOOL_YEAR_START, TODAY);
  for (const p of allStaff) {
    const key = `abs:${p.email}`;
    const n = pickW(key, 'n', [
      [0, 20],
      [1, 35],
      [2, 30],
      [3, 12],
      [4, 3],
    ]);
    for (let i = 0; i < n; i++) {
      const ak = `${key}:${i}`;
      const code = pickW(ak, 'cat', [
        ['SICKNESS', 50],
        ['TRAINING', 15],
        ['MEDICAL_APPOINTMENT', 12],
        ['CHILDCARE_SICK', 6],
        ['ACCIDENT', 4],
        ['COMPENSATION', 4],
        ['OFFICIAL_APPOINTMENT', 3],
        ['MILITARY_SERVICE', 2],
        ['UNPAID_LEAVE', 2],
        ['FUNERAL', 1],
        ['MOVE', 1],
      ]);
      const catId = category.get(code);
      if (!catId) continue;
      let start = addDays(
        SCHOOL_YEAR_START,
        rInt(ak, 'start', 0, Math.max(1, yearDays - 3)),
      );
      while (isWeekend(start)) start = addDays(start, 1);
      const len =
        code === 'MILITARY_SERVICE'
          ? 14
          : code === 'TRAINING'
            ? rInt(ak, 'len', 1, 3)
            : code === 'SICKNESS' || code === 'ACCIDENT'
              ? rInt(ak, 'len', 1, 5)
              : 1;
      const end = addDays(start, len - 1);
      const { rows: ex } = await c.query(
        `SELECT 1 FROM employee_absences WHERE employee_id = $1 AND "startDate" = $2::timestamptz`,
        [p.employee_id, start],
      );
      if (ex[0]) continue;
      const absenceId = randomUUID();
      await c.query(
        `INSERT INTO employee_absences (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, membership_id, employee_id, absence_category_id, "startDate", "endDate")
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)`,
        [absenceId, ORG_ID, p.membership_id, p.employee_id, catId, start, end],
      );
      for (let d = start; d <= end; d = addDays(d, 1)) {
        if (isWeekend(d)) continue;
        await c.query(
          `INSERT INTO employee_absence_days (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                employee_absence_id, absence_category_id, employee_id, organization_id, date)
           VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6::date)`,
          [randomUUID(), absenceId, catId, p.employee_id, ORG_ID, d],
        );
      }
      absences++;
    }
  }
  console.log(`✓ Staff absences (+${absences})`);

  // Employee vacations (individual, on top of company vacations)
  let vacations = 0;
  const VACATION_SLOTS: [string, string, string][] = [
    ['Herbstferien', '2025-10-06', '2025-10-17'],
    ['Weiterbildung / Brückentag', '2025-11-21', '2025-11-21'],
    ['Skiferien', '2026-02-23', '2026-02-27'],
    ['Frühlingsferien', '2026-04-20', '2026-05-01'],
    ['Auffahrtsbrücke', '2026-05-15', '2026-05-15'],
  ];
  for (const p of allStaff) {
    const key = `vac:${p.email}`;
    for (const [name, start, end] of VACATION_SLOTS) {
      if (rnd(key, name) > 0.45) continue;
      const { rowCount } = await c.query(
        `INSERT INTO employee_vacations (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, employee_id, membership_id, name, start_date, end_date, accrual_type, remark)
         SELECT $1, 1, true, false, now(), now(), $2, $3, $4, $5, $6::date, $7::date, 'CHARGED'::employee_vacations_accrual_type_enum, NULL
          WHERE NOT EXISTS (SELECT 1 FROM employee_vacations WHERE employee_id = $3 AND start_date = $6::date)`,
        [
          randomUUID(),
          ORG_ID,
          p.employee_id,
          p.membership_id,
          name,
          start,
          end,
        ],
      );
      vacations += rowCount ?? 0;
    }
  }
  console.log(`✓ Staff vacations (+${vacations})`);

  // Teams
  const teams = new Map<string, { members: string[]; lead: string | null }>();
  for (const s of LARGE_STAFF) {
    if (!teams.has(s.team)) teams.set(s.team, { members: [], lead: null });
    const t = teams.get(s.team)!;
    t.members.push(s.email);
    if (s.teamLead) t.lead = s.email;
  }
  // Base-seed teachers join the stage teams of their classes.
  const baseByClass: Record<string, string> = {
    'Kinderhaus 1': 'Team Kinderhaus & Kindergarten',
    'Kinderhaus 2': 'Team Kinderhaus & Kindergarten',
    'Klasse PA': 'Team Unterstufe',
    'Klasse PB': 'Team Unterstufe',
    'Klasse OA': 'Team Oberstufe',
  };
  const { rows: baseTeachers } = await c.query<{ email: string; name: string }>(
    `SELECT ue.email, sc.name
       FROM school_class_teachers sct
       JOIN school_classes sc ON sc.id = sct.school_class_id
       JOIN memberships m ON m.employee_id = sct.employee_id
       JOIN user_emails ue ON ue.id = m.user_email_id
      WHERE sct.organization_id = $1 AND ue.email IN ('sandra.lehrerin@testschule.ch','thomas.lehrer@testschule.ch','mira.assistentin@testschule.ch','daniel.lehrer@testschule.ch','petra.lehrerin@testschule.ch')`,
    [ORG_ID],
  );
  for (const r of baseTeachers) {
    const team = baseByClass[r.name];
    if (
      team &&
      teams.has(team) &&
      !teams.get(team)!.members.includes(r.email)
    ) {
      teams.get(team)!.members.push(r.email);
    }
  }
  if (teams.has('Hausdienst & Küche'))
    teams
      .get('Hausdienst & Küche')!
      .members.push('lukas.hauswart@testschule.ch');
  if (teams.has('Administration'))
    teams
      .get('Administration')!
      .members.push(
        'admin@testschule.ch',
        'hr@testschule.ch',
        'sekretariat@testschule.ch',
      );

  const employeeByEmail = new Map(
    allStaff.map((p) => [p.email, p.employee_id]),
  );
  let teamsAdded = 0;
  let members = 0;
  let sortOrder = 10;
  for (const [name, t] of teams) {
    let teamId: string;
    const { rows: ex } = await c.query<{ id: string }>(
      `SELECT id FROM teams WHERE organization_id = $1 AND name = $2`,
      [ORG_ID, name],
    );
    if (ex[0]) {
      teamId = ex[0].id;
    } else {
      teamId = randomUUID();
      await c.query(
        `INSERT INTO teams (id, version, "isActive", "isArchived", "createdAt", "updatedAt", organization_id, name, "sortOrder")
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4)`,
        [teamId, ORG_ID, name, sortOrder++],
      );
      teamsAdded++;
    }
    for (const email of t.members) {
      const empId = employeeByEmail.get(email);
      if (!empId) continue;
      const { rowCount } = await c.query(
        `INSERT INTO team_members (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, team_id, employee_id, role)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5::team_members_role_enum)
         ON CONFLICT (team_id, employee_id) DO NOTHING`,
        [
          randomUUID(),
          ORG_ID,
          teamId,
          empId,
          email === t.lead ? 'LEAD' : 'MEMBER',
        ],
      );
      members += rowCount ?? 0;
    }
  }
  console.log(`✓ Teams (+${teamsAdded}), team members (+${members})`);

  // Time tracking: enable for non-teaching / support roles, 8 weeks of entries.
  const ttStaff = LARGE_STAFF.filter((s) => s.timeTracking);
  await c.query(
    `UPDATE employees SET time_tracking_enabled = true WHERE id = ANY($1::uuid[])`,
    [
      ttStaff
        .map((s) => staffIds.get(s.email)?.employeeId)
        .filter((x): x is string => Boolean(x)),
    ],
  );
  let entries = 0;
  const SEED_NOTE = '__seed_tt__';
  for (const s of ttStaff) {
    const ids = staffIds.get(s.email);
    if (!ids) continue;
    // Part-timers work fewer weekdays: workload → days per week.
    const daysPerWeek = Math.max(1, Math.round((s.workload / 100) * 5));
    const workDays = [1, 2, 3, 4, 5].filter(
      (_, idx) => idx < daysPerWeek || rnd(s.email, `wd${idx}`) < 0.1,
    );
    for (let weekAgo = 0; weekAgo < 8; weekAgo++) {
      for (const dow of workDays) {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        const currentDow = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
        d.setUTCDate(d.getUTCDate() - weekAgo * 7 - (currentDow - dow));
        if (d.getTime() > Date.now()) continue;
        const entryDate = isoDate(d);
        const ek = `${ids.employeeId}:${entryDate}`;
        if (rnd(ek, 'skip') < 0.05) continue; // the odd day off
        const { rows: ex } = await c.query(
          `SELECT 1 FROM time_tracking_entries WHERE employee_id = $1 AND entry_date = $2 AND notes = $3`,
          [ids.employeeId, entryDate, SEED_NOTE],
        );
        if (ex[0]) continue;
        const startHour = rInt(ek, 'sh', 6, 8);
        const startMin = rInt(ek, 'sm', 0, 59);
        const fullDay = daysPerWeek >= 4 || s.workload >= 60;
        const workMinutes = fullDay
          ? rInt(ek, 'wm', 380, 480)
          : rInt(ek, 'wm', 200, 320);
        const breakMinutes = fullDay ? 30 : 15;
        const startedAt = new Date(
          `${entryDate}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00Z`,
        );
        const endedAt = new Date(
          startedAt.getTime() + (workMinutes + breakMinutes) * 60_000,
        );
        await c.query(
          `INSERT INTO time_tracking_entries (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
                organization_id, employee_id, started_at, ended_at, break_minutes, entry_date, work_minutes, source, notes)
           VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5, $6, $7, $8, $9::time_tracking_entries_source_enum, $10)`,
          [
            randomUUID(),
            ORG_ID,
            ids.employeeId,
            startedAt.toISOString(),
            endedAt.toISOString(),
            breakMinutes,
            entryDate,
            workMinutes,
            rnd(ek, 'src') < 0.7 ? 'CLOCK' : 'MANUAL',
            SEED_NOTE,
          ],
        );
        entries++;
      }
    }
  }
  console.log(
    `✓ Time-tracking entries (+${entries} for ${ttStaff.length} staff)`,
  );
}

// ---------------------------------------------------------------------------
// L8. Protocols (meeting minutes)
// ---------------------------------------------------------------------------

async function seedProtocols(
  c: Client,
  ORG_ID: string,
  staffIds: Map<string, StaffUserIds>,
) {
  const { rows: adminRow } = await c.query<{ id: string }>(
    `SELECT m.id FROM memberships m JOIN user_emails ue ON ue.id = m.user_email_id
      WHERE m.organization_id = $1 AND ue.email = 'admin@testschule.ch' LIMIT 1`,
    [ORG_ID],
  );
  const adminMembership = adminRow[0]?.id ?? null;
  const leads = LARGE_STAFF.filter(
    (s) => s.teamLead || /Schulleitung/.test(s.position),
  );

  const PROJECTS: {
    title: string;
    description: string;
    color: string;
    protocols: {
      title: string;
      date: string;
      status: 'DRAFT' | 'FINALIZED';
      sections: unknown;
    }[];
  }[] = [
    {
      title: 'Teamsitzungen 2025/26',
      description:
        'Wöchentliche Teamsitzung der Stufenleitungen mit Schulleitung. Protokolle der Sitzungen.',
      color: '#0EA5E9',
      protocols: (
        [
          [
            '2025-08-25',
            'Teamsitzung KW 35 — Schuljahresstart',
            [
              'Rückblick erste Woche',
              'Neue Kinder Kinderhaus',
              'Notfallkontakte aktualisieren',
            ],
            'Alle Klassen prüfen die Notfallkontakte bis Ende September.',
            'Sekretariat',
          ],
          [
            '2025-09-22',
            'Teamsitzung KW 39 — Elternabende',
            [
              'Elternabende planen',
              'Beobachtungsraster Hattie',
              'Herbstferien Betreuung',
            ],
            'Elternabende zwischen 6. und 17. Oktober, Einladung via App.',
            'Stufenleitungen',
          ],
          [
            '2025-10-27',
            'Teamsitzung KW 44 — Standortgespräche',
            ['Standortgespräche Q4', 'Lernberichte', 'Materialbudget'],
            'Lernberichte Kinderhaus bis 30. November, Primar bis 15. Dezember.',
            'Klassenleitungen',
          ],
          [
            '2025-11-24',
            'Teamsitzung KW 48 — Adventszeit',
            ['Adventsfeier', 'Weihnachtsferien Hort', 'Krankheitswelle'],
            'Adventsfeier am 18. Dezember, Beitrag pro Stufe.',
            'Team Kinderhaus & Kindergarten',
          ],
          [
            '2026-01-19',
            'Teamsitzung KW 4 — Aufnahmen 2026/27',
            ['Aufnahmeprozess Stand', 'Hospitationen', 'Klassengrössen'],
            'Max. 20 Kinder pro Kindergartenklasse, Warteliste ab Platz 21.',
            'Schulleitung',
          ],
          [
            '2026-03-02',
            'Teamsitzung KW 10 — Weiterbildung',
            [
              'Weiterbildungstag April',
              'Curriculum Mittelstufe Ergänzungen',
              'Sportferien Rückblick',
            ],
            'Weiterbildungstag 17. April: Record Keeping & Beobachtung.',
            'Schulleitung',
          ],
          [
            '2026-04-27',
            'Teamsitzung KW 18 — Übertritte',
            [
              'Übertritte Kinderhaus → Kindergarten',
              'Übertritte Mittelstufe → Oberstufe',
              'Sommerfest',
            ],
            'Übertrittsgespräche bis Ende Mai, Klassenlisten Ende Juni.',
            'Stufenleitungen',
          ],
          [
            '2026-06-08',
            'Teamsitzung KW 24 — Schuljahresende',
            ['Zeugnisse/Lernberichte', 'Abschlussfeier', 'Planung 2026/27'],
            'Lernberichte bis 26. Juni fertig, Abschlussfeier 3. Juli.',
            'Klassenleitungen',
          ],
          [
            '2026-08-24',
            'Teamsitzung KW 35 — Start 2026/27',
            ['Neue Mitarbeitende', 'Klassenzuteilung', 'Offene Punkte Sommer'],
            '',
            '',
          ],
        ] as [string, string, string[], string, string][]
      ).map(([date, title, agenda, decision, responsible], idx, arr) => ({
        title,
        date,
        status:
          idx === arr.length - 1 ? ('DRAFT' as const) : ('FINALIZED' as const),
        sections: {
          agendaItems: agenda.map((topic, no) => ({
            no: no + 1,
            topic,
            goal: no === 0 ? 'DECISION' : 'DISCUSSION',
          })),
          decisions: decision
            ? [{ topic: agenda[0], decision, responsible }]
            : [],
          communications: [
            {
              topic: 'Protokoll an alle Teams',
              audience: 'Alle Mitarbeitenden',
              channel: 'App',
            },
          ],
          infoPoints: [
            `Anwesend: Schulleitung, ${leads.length} Stufen-/Bereichsleitungen.`,
          ],
          challenges:
            idx % 3 === 1
              ? [
                  {
                    topic: 'Personalengpass bei Krankheit',
                    mitigation: 'Springer-Pool aus Assistenzen',
                  },
                ]
              : [],
          openPoints: [
            {
              topic: agenda[2],
              nextStep: 'Nächste Sitzung',
              forNextMeeting: true,
            },
          ],
        },
      })),
    },
    {
      title: 'Schulentwicklung: Beobachtung & Record Keeping',
      description:
        'Einführung der Beobachtungsachsen (Engagement, Konzentration, Persistenz, Selbstvertrauen) in allen Stufen.',
      color: '#10B981',
      protocols: [
        {
          title: 'Kickoff Beobachtungsachsen',
          date: '2025-09-15',
          status: 'FINALIZED',
          sections: {
            agendaItems: [
              { no: 1, topic: 'Ziel: Know thy impact', goal: 'DISCUSSION' },
              {
                no: 2,
                topic: 'Pilot Unterstufe A + Mittelstufe A',
                goal: 'DECISION',
              },
            ],
            decisions: [
              {
                topic: 'Pilot',
                decision:
                  'Pilot in zwei Klassen bis Weihnachten, danach Ausrollen.',
                responsible: 'Stufenleitung Unterstufe',
              },
            ],
            communications: [],
            infoPoints: [
              'Achsen sind optional pro Record, keine Pflichtfelder.',
            ],
            challenges: [
              {
                topic: 'Zeitaufwand pro Eintrag',
                mitigation: 'Schnellerfassung auf Tablet',
              },
            ],
            openPoints: [
              {
                topic: 'Auswertungs-Dashboard',
                nextStep: 'Wunschliste sammeln',
                forNextMeeting: true,
              },
            ],
          },
        },
        {
          title: 'Zwischenbilanz Pilot',
          date: '2026-01-12',
          status: 'FINALIZED',
          sections: {
            agendaItems: [
              { no: 1, topic: 'Erfahrungen Pilotklassen', goal: 'DISCUSSION' },
              { no: 2, topic: 'Rollout alle Stufen', goal: 'DECISION' },
            ],
            decisions: [
              {
                topic: 'Rollout',
                decision: 'Ab Februar in allen Klassen inkl. Kinderhaus.',
                responsible: 'Schulleitung',
              },
            ],
            communications: [
              {
                topic: 'Info an Eltern',
                audience: 'Alle Eltern',
                channel: 'Elternbrief',
              },
            ],
            infoPoints: [
              'Muster im Engagement zeigen Winterloch — Einführungsrhythmus anpassen.',
            ],
            challenges: [],
            openPoints: [],
          },
        },
      ],
    },
  ];

  let projectsAdded = 0;
  let protocolsAdded = 0;
  for (const p of PROJECTS) {
    let projectId: string;
    const { rows: ex } = await c.query<{ id: string }>(
      `SELECT id FROM projects WHERE organization_id = $1 AND title = $2`,
      [ORG_ID, p.title],
    );
    if (ex[0]) {
      projectId = ex[0].id;
    } else {
      projectId = randomUUID();
      await c.query(
        `INSERT INTO projects (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, title, description, status, color, created_by_membership_id)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, 'ACTIVE'::projects_status_enum, $5, $6)`,
        [projectId, ORG_ID, p.title, p.description, p.color, adminMembership],
      );
      projectsAdded++;
    }
    const memberIds = [
      ...(adminMembership ? [[adminMembership, 'OWNER']] : []),
      ...leads.map((s) => [staffIds.get(s.email)?.membershipId, 'MEMBER']),
    ].filter((m): m is [string, string] => Boolean(m[0]));
    for (const [membershipId, role] of memberIds) {
      await c.query(
        `INSERT INTO project_members (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, project_id, membership_id, role)
         VALUES ($1, 1, true, false, now(), now(), $2, $3, $4, $5::project_members_role_enum)
         ON CONFLICT (project_id, membership_id) DO NOTHING`,
        [randomUUID(), ORG_ID, projectId, membershipId, role],
      );
    }
    for (const pr of p.protocols) {
      const { rowCount } = await c.query(
        `INSERT INTO protocols (id, version, "isActive", "isArchived", "createdAt", "updatedAt",
              organization_id, project_id, title, meeting_date, status, created_by_membership_id, sections)
         SELECT $1, 1, true, false, $5::date, $5::date, $2, $3, $4, $5::date, $6::protocols_status_enum, $7, $8::jsonb
          WHERE NOT EXISTS (SELECT 1 FROM protocols WHERE organization_id = $2 AND project_id = $3 AND title = $4)`,
        [
          randomUUID(),
          ORG_ID,
          projectId,
          pr.title,
          pr.date,
          pr.status,
          adminMembership,
          JSON.stringify(pr.sections),
        ],
      );
      protocolsAdded += rowCount ?? 0;
    }
  }
  console.log(`✓ Projects (+${projectsAdded}), protocols (+${protocolsAdded})`);
}
