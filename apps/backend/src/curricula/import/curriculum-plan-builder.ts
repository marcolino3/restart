import { CurriculumLocale } from '../enums/curriculum-locale.enum';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import type {
  CurriculumParseResult,
  CurriculumRawRow,
} from './curriculum-file-parser';

export interface PlanTranslation {
  locale: CurriculumLocale;
  name: string;
  notes?: string | null;
}

export interface PlanNode {
  tempId: string;
  nodeType: CurriculumNodeType;
  position: number;
  translations: PlanTranslation[];
  children: PlanNode[];
  sourceRowNumber?: number;
}

export interface PlanLevel {
  slug: string;
  position: number;
  translations: PlanTranslation[];
  roots: PlanNode[];
}

export interface ImportPlan {
  sourceLocale: CurriculumLocale;
  levels: PlanLevel[];
  stats: {
    rowCount: number;
    levelCount: number;
    areaCount: number;
    topicCount: number;
    groupCount: number;
    lessonCount: number;
  };
  warnings: string[];
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'level'
  );
}

let tempIdSeq = 0;
function nextTempId(): string {
  tempIdSeq += 1;
  return `tmp_${tempIdSeq}`;
}

interface NodeFactoryOptions {
  name: string;
  nodeType: CurriculumNodeType;
  locale: CurriculumLocale;
  sourceRowNumber?: number;
}

function makeNode(opts: NodeFactoryOptions): PlanNode {
  return {
    tempId: nextTempId(),
    nodeType: opts.nodeType,
    position: 0,
    translations: [{ locale: opts.locale, name: opts.name }],
    children: [],
    sourceRowNumber: opts.sourceRowNumber,
  };
}

function bumpStats(
  stats: ImportPlan['stats'],
  nodeType: CurriculumNodeType,
): void {
  if (nodeType === CurriculumNodeType.AREA) stats.areaCount += 1;
  else if (nodeType === CurriculumNodeType.TOPIC) stats.topicCount += 1;
  else if (nodeType === CurriculumNodeType.GROUP) stats.groupCount += 1;
  else if (nodeType === CurriculumNodeType.LESSON) stats.lessonCount += 1;
}

function stripIndexes(nodes: PlanNode[]): void {
  for (const node of nodes) {
    delete (node as PlanNode & { _childrenIndex?: unknown })._childrenIndex;
    stripIndexes(node.children);
  }
}

function buildPathForRow(
  row: CurriculumRawRow,
): { name: string; nodeType: CurriculumNodeType }[] {
  const segments: { name: string; nodeType: CurriculumNodeType }[] = [];
  if (row.area)
    segments.push({ name: row.area, nodeType: CurriculumNodeType.AREA });
  if (row.topic)
    segments.push({ name: row.topic, nodeType: CurriculumNodeType.TOPIC });
  if (row.group)
    segments.push({ name: row.group, nodeType: CurriculumNodeType.GROUP });
  if (row.lesson)
    segments.push({ name: row.lesson, nodeType: CurriculumNodeType.LESSON });
  return segments;
}

interface MasterBuildResult {
  levels: PlanLevel[];
  /** master path key → node (also includes levels under key `L::<levelName>`) */
  pathToNode: Map<string, PlanNode | PlanLevel>;
  stats: ImportPlan['stats'];
}

function buildMaster(
  rows: CurriculumRawRow[],
  master: CurriculumLocale,
): MasterBuildResult {
  const levelsByKey = new Map<
    string,
    { level: PlanLevel; childrenByName: Map<string, PlanNode> }
  >();
  const levelOrder: string[] = [];
  const pathToNode = new Map<string, PlanNode | PlanLevel>();

  const stats: ImportPlan['stats'] = {
    rowCount: rows.length,
    levelCount: 0,
    areaCount: 0,
    topicCount: 0,
    groupCount: 0,
    lessonCount: 0,
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (a.level !== b.level) {
      return rows.indexOf(a) - rows.indexOf(b);
    }
    const aSeq = a.sequence ?? Number.POSITIVE_INFINITY;
    const bSeq = b.sequence ?? Number.POSITIVE_INFINITY;
    if (aSeq !== bSeq) return aSeq - bSeq;
    return a.rowNumber - b.rowNumber;
  });

  for (const row of sortedRows) {
    const levelKey = row.level.trim();
    let bucket = levelsByKey.get(levelKey);
    if (!bucket) {
      const level: PlanLevel = {
        slug: slugify(levelKey),
        position: levelOrder.length,
        translations: [{ locale: master, name: levelKey }],
        roots: [],
      };
      bucket = { level, childrenByName: new Map() };
      levelsByKey.set(levelKey, bucket);
      levelOrder.push(levelKey);
      stats.levelCount += 1;
      pathToNode.set(`L::${levelKey}`, level);
    }

    const path = buildPathForRow(row);
    if (path.length === 0) continue;

    let parentChildren = bucket.level.roots;
    let parentChildrenIndex = bucket.childrenByName;
    let parentPathKey = `L::${levelKey}`;

    for (let depth = 0; depth < path.length; depth++) {
      const segment = path[depth];
      const key = `${parentPathKey}/${segment.nodeType}::${segment.name}`;
      let node = parentChildrenIndex.get(key);
      if (!node) {
        node = makeNode({
          name: segment.name,
          nodeType: segment.nodeType,
          locale: master,
          sourceRowNumber: row.rowNumber,
        });
        node.position = parentChildren.length;
        parentChildren.push(node);
        parentChildrenIndex.set(key, node);
        bumpStats(stats, segment.nodeType);
        pathToNode.set(key, node);
      }
      const nestedIndex = (
        node as PlanNode & { _childrenIndex?: Map<string, PlanNode> }
      )._childrenIndex;
      let nextIndex = nestedIndex;
      if (!nextIndex) {
        nextIndex = new Map<string, PlanNode>();
        (
          node as PlanNode & { _childrenIndex?: Map<string, PlanNode> }
        )._childrenIndex = nextIndex;
      }
      parentChildren = node.children;
      parentChildrenIndex = nextIndex;
      parentPathKey = key;
    }
  }

  for (const bucket of levelsByKey.values()) {
    stripIndexes(bucket.level.roots);
  }

  const levels = levelOrder.map((key) => levelsByKey.get(key)!.level);
  return { levels, pathToNode, stats };
}

function upsertTranslation(
  node: PlanNode | PlanLevel,
  locale: CurriculumLocale,
  name: string | null | undefined,
  label: string,
  warnings: string[],
): void {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return;
  const existing = node.translations.find((t) => t.locale === locale);
  if (!existing) {
    node.translations.push({ locale, name: trimmed });
    return;
  }
  if (existing.name !== trimmed) {
    warnings.push(
      `${label}: ${locale} translation has conflicting values ("${existing.name}" vs "${trimmed}") — first value kept`,
    );
  }
}

/**
 * Walk the same hierarchy as the master row but using translated names.
 * Each ancestor (level, area, topic, group, lesson) gets the locale
 * translation attached. The master row determines the canonical path keys.
 */
function attachTranslationsFromRow(
  masterRow: CurriculumRawRow,
  translatedRow: CurriculumRawRow,
  locale: CurriculumLocale,
  built: MasterBuildResult,
  warnings: string[],
): void {
  const levelKey = masterRow.level.trim();
  const levelNode = built.pathToNode.get(`L::${levelKey}`);
  if (levelNode) {
    upsertTranslation(
      levelNode,
      locale,
      translatedRow.level,
      `Level "${levelKey}"`,
      warnings,
    );
  }

  const masterPath = buildPathForRow(masterRow);
  const translatedPath = buildPathForRow(translatedRow);

  let parentPathKey = `L::${levelKey}`;
  for (let i = 0; i < masterPath.length; i++) {
    const masterSeg = masterPath[i];
    const transSeg = translatedPath[i];
    const key = `${parentPathKey}/${masterSeg.nodeType}::${masterSeg.name}`;
    const node = built.pathToNode.get(key);
    if (!node) {
      warnings.push(
        `Sheet ${locale} row ${translatedRow.rowNumber}: master hierarchy not found, translation skipped`,
      );
      return;
    }
    if (transSeg) {
      upsertTranslation(
        node,
        locale,
        transSeg.name,
        `${masterSeg.nodeType} "${masterSeg.name}"`,
        warnings,
      );
    }
    parentPathKey = key;
  }
}

export function buildImportPlan(parsed: CurriculumParseResult): ImportPlan {
  const warnings = [...parsed.warnings];
  const master = parsed.master;
  const masterRows = parsed.sheetsByLocale[master] ?? [];

  tempIdSeq = 0;
  const built = buildMaster(masterRows, master);

  // Sequence → masterRow lookup for translation joins.
  const masterRowsBySeq = new Map<number, CurriculumRawRow>();
  for (const row of masterRows) {
    if (row.sequence !== null) masterRowsBySeq.set(row.sequence, row);
  }

  for (const localeStr of Object.keys(
    parsed.sheetsByLocale,
  ) as CurriculumLocale[]) {
    if (localeStr === master) continue;
    const rows = parsed.sheetsByLocale[localeStr];
    if (!rows) continue;

    let extra = 0;
    const seenSeqs = new Set<number>();
    for (const row of rows) {
      if (row.sequence === null) continue; // warning already added in parser
      seenSeqs.add(row.sequence);
      const masterRow = masterRowsBySeq.get(row.sequence);
      if (!masterRow) {
        extra += 1;
        continue;
      }
      attachTranslationsFromRow(masterRow, row, localeStr, built, warnings);
    }

    let missing = 0;
    for (const seq of masterRowsBySeq.keys()) {
      if (!seenSeqs.has(seq)) missing += 1;
    }
    if (missing > 0) {
      warnings.push(
        `Sheet ${localeStr}: ${missing} master row(s) without ${localeStr} translation`,
      );
    }
    if (extra > 0) {
      warnings.push(
        `Sheet ${localeStr}: ${extra} row(s) reference a Sequence that does not exist in master — ignored`,
      );
    }
  }

  return {
    sourceLocale: master,
    levels: built.levels,
    stats: built.stats,
    warnings,
  };
}
