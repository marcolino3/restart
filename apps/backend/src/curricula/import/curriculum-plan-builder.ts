import { CurriculumLocale } from '../enums/curriculum-locale.enum';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import type { CurriculumRawRow } from './curriculum-file-parser';

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

export function buildImportPlan(
  rows: CurriculumRawRow[],
  options: { sourceLocale?: CurriculumLocale; warnings?: string[] } = {},
): ImportPlan {
  const sourceLocale = options.sourceLocale ?? CurriculumLocale.DE;
  const warnings = [...(options.warnings ?? [])];
  tempIdSeq = 0;

  const levelsByKey = new Map<
    string,
    {
      level: PlanLevel;
      childrenByName: Map<string, PlanNode>;
    }
  >();
  const levelOrder: string[] = [];

  const stats = {
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
        translations: [{ locale: sourceLocale, name: levelKey }],
        roots: [],
      };
      bucket = { level, childrenByName: new Map() };
      levelsByKey.set(levelKey, bucket);
      levelOrder.push(levelKey);
      stats.levelCount += 1;
    }
    const path = buildPathForRow(row);
    if (path.length === 0) continue;

    let parentChildren = bucket.level.roots;
    let parentChildrenIndex = bucket.childrenByName;
    let parentPathKey = '';

    for (let depth = 0; depth < path.length; depth++) {
      const segment = path[depth];
      const key = `${parentPathKey}/${segment.nodeType}::${segment.name}`;
      let node = parentChildrenIndex.get(key);
      if (!node) {
        node = makeNode({
          name: segment.name,
          nodeType: segment.nodeType,
          locale: sourceLocale,
          sourceRowNumber: row.rowNumber,
        });
        node.position = parentChildren.length;
        parentChildren.push(node);
        parentChildrenIndex.set(key, node);
        bumpStats(stats, segment.nodeType);
      }
      const nestedIndex = (
        node as PlanNode & {
          _childrenIndex?: Map<string, PlanNode>;
        }
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

  return { sourceLocale, levels, stats, warnings };
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
    segments.push({
      name: row.group,
      nodeType: CurriculumNodeType.GROUP,
    });
  if (row.lesson)
    segments.push({ name: row.lesson, nodeType: CurriculumNodeType.LESSON });
  return segments;
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
