export type CurriculumLocale = "DE" | "FR" | "EN" | "IT";

export const CURRICULUM_LOCALES: CurriculumLocale[] = ["DE", "FR", "IT", "EN"];

export type CurriculumNodeType = "AREA" | "TOPIC" | "GROUP" | "LESSON";

export const NODE_TYPE_RANK: Record<CurriculumNodeType, number> = {
  AREA: 0,
  TOPIC: 1,
  GROUP: 2,
  LESSON: 3,
};

export type CurriculumTranslationDTO = {
  locale: CurriculumLocale;
  name: string;
  description?: string | null;
};

export type CurriculumNodeTranslationDTO = {
  locale: CurriculumLocale;
  name: string;
  notes?: string | null;
};

export type CurriculumLevelTranslationDTO = {
  locale: CurriculumLocale;
  name: string;
};

export type CurriculumLevelDTO = {
  id: string;
  slug: string;
  position: number;
  isArchived: boolean;
  translations: CurriculumLevelTranslationDTO[];
};

export type CurriculumDTO = {
  id: string;
  slug: string;
  position: number;
  isArchived: boolean;
  translations: CurriculumTranslationDTO[];
};

export type CurriculumNodeDTO = {
  id: string;
  curriculumId: string;
  levelId: string;
  parentId: string | null;
  nodeType: CurriculumNodeType;
  position: number;
  isArchived: boolean;
  translations: CurriculumNodeTranslationDTO[];
};

export type CurriculumTreeNode = CurriculumNodeDTO & {
  children: CurriculumTreeNode[];
};

export type ImportPlanTranslation = {
  locale: CurriculumLocale;
  name: string;
  notes?: string | null;
};

export type ImportPlanNode = {
  tempId: string;
  nodeType: CurriculumNodeType;
  position: number;
  translations: ImportPlanTranslation[];
  children: ImportPlanNode[];
  sourceRowNumber?: number | null;
};

export type ImportPlanLevel = {
  slug: string;
  position: number;
  translations: ImportPlanTranslation[];
  roots: ImportPlanNode[];
};

export type ImportPlanStats = {
  rowCount: number;
  levelCount: number;
  areaCount: number;
  topicCount: number;
  groupCount: number;
  lessonCount: number;
};

export type ImportPlan = {
  sourceLocale: CurriculumLocale;
  levels: ImportPlanLevel[];
  stats: ImportPlanStats;
  warnings: string[];
};

export function pickTranslation<
  T extends { locale: CurriculumLocale; name: string },
>(translations: T[], preferred: CurriculumLocale): T | undefined {
  return (
    translations.find((t) => t.locale === preferred) ??
    translations.find((t) => t.locale === "DE") ??
    translations.find((t) => t.locale === "EN") ??
    translations[0]
  );
}

export function buildTree(nodes: CurriculumNodeDTO[]): CurriculumTreeNode[] {
  const byId = new Map<string, CurriculumTreeNode>();
  for (const n of nodes) byId.set(n.id, { ...n, children: [] });
  const roots: CurriculumTreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortByPosition = (a: CurriculumTreeNode, b: CurriculumTreeNode) =>
    a.position - b.position;
  const recurse = (list: CurriculumTreeNode[]) => {
    list.sort(sortByPosition);
    list.forEach((n) => recurse(n.children));
  };
  recurse(roots);
  return roots;
}
