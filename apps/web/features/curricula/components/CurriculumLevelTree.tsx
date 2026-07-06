"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Archive,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  GripVertical,
  Languages,
  RotateCcw,
} from "lucide-react";
import { ArchiveConfirmationDialog } from "@/components/common/ArchiveConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { handleAction } from "@/lib/actions/handle-action";
import { archiveCurriculumNodeAction } from "../actions/archive-curriculum-node.action";
import { unarchiveCurriculumNodeAction } from "../actions/unarchive-curriculum-node.action";
import { reorderCurriculumNodesAction } from "../actions/reorder-curriculum-nodes.action";
import {
  buildTree,
  pickTranslation,
  type CurriculumLocale,
  type CurriculumNodeDTO,
  type CurriculumNodeType,
  type CurriculumTreeNode,
} from "../types";
import { LocaleBadge } from "./LocaleBadge";
import { CurriculumNodeTranslationsDialog } from "./CurriculumNodeTranslationsDialog";
import { LessonClassificationBadges } from "./LessonClassificationBadges";
import { PrerequisitesEditor } from "@/features/record-keeping/components/PrerequisitesEditor";
import type { LessonOption } from "@/features/record-keeping/types";
import type { LessonScale, LessonType } from "../types";

interface Props {
  curriculumId: string;
  levelId: string;
  initialNodes: CurriculumNodeDTO[];
  /** External signal: when this value changes, expand all nodes. */
  expandSignal?: number;
  /** External signal: when this value changes, collapse all nodes. */
  collapseSignal?: number;
  /** Optional controlled filter from parent. When set, the internal filter UI is hidden. */
  externalFilter?: string;
  /** Hide internal toolbar (filter input + expand-all button) when parent provides its own. */
  hideToolbar?: boolean;
  /** All LESSON-nodes of the org. When provided, LESSON rows expose a Prerequisites button. */
  allLessons?: LessonOption[];
}

const NODE_TYPE_I18N_KEY: Record<CurriculumTreeNode["nodeType"], string> = {
  AREA: "nodeTypeArea",
  TOPIC: "nodeTypeTopic",
  GROUP: "nodeTypeGroup",
  LESSON: "nodeTypeLesson",
};

/**
 * Returns true when two node arrays describe the same tree from DnD's
 * point of view: same ids, parents, positions, classification, archive
 * state. Translation deltas are intentionally ignored — they change on
 * every locale switch and would otherwise force a full state reset that
 * tears down `@dnd-kit`'s sortable items.
 */
function nodesStructurallyEqual(
  a: CurriculumNodeDTO[],
  b: CurriculumNodeDTO[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.parentId !== y.parentId ||
      x.position !== y.position ||
      x.isArchived !== y.isArchived ||
      x.lessonType !== y.lessonType ||
      x.lessonScale !== y.lessonScale ||
      x.nodeType !== y.nodeType
    ) {
      return false;
    }
  }
  return true;
}

/** Color-dot palette for the area sidebar (design handoff `.cu-area .swd`). */
const AREA_DOT_CLASSES = [
  "bg-status-rose-foreground",
  "bg-status-amber-foreground",
  "bg-primary",
  "bg-status-sky-foreground",
  "bg-status-green-foreground",
  "bg-status-slate-foreground",
];

/** Node label styled per node type (design handoff `.cu-th b` / `.cu-grp` / `.nm`). */
function NodeName({
  node,
  name,
}: {
  node: CurriculumTreeNode;
  name: string;
}) {
  switch (node.nodeType) {
    case "GROUP":
      return (
        <span className="truncate text-[12px] font-[650] tracking-[0.04em] uppercase text-muted-foreground">
          {name}
        </span>
      );
    case "LESSON":
      return <span className="truncate text-[13px] font-medium">{name}</span>;
    default:
      return <span className="truncate text-[13.5px] font-[650]">{name}</span>;
  }
}

/** Counts descendants of a given node type in the subtree below `node`. */
function countDescendants(
  node: CurriculumTreeNode,
  type: CurriculumNodeType,
): number {
  let count = 0;
  const walk = (n: CurriculumTreeNode) => {
    for (const child of n.children) {
      if (child.nodeType === type) count++;
      walk(child);
    }
  };
  walk(node);
  return count;
}

export function CurriculumLevelTree({
  curriculumId,
  levelId,
  initialNodes,
  expandSignal,
  collapseSignal,
  externalFilter,
  hideToolbar,
  allLessons,
}: Props) {
  const t = useTranslations("Curricula");
  const router = useRouter();
  const locale = useLocale();
  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  const [nodes, setNodes] = useState<CurriculumNodeDTO[]>(initialNodes);
  const [editingNode, setEditingNode] = useState<CurriculumNodeDTO | null>(
    null,
  );
  const [internalFilter, setInternalFilter] = useState("");
  const [manualExpanded, setManualExpanded] = useState<Set<string>>(new Set());

  // Only swap the local state when the server data actually changed in a way
  // that matters for rendering/DnD. Otherwise we'd churn refs on every
  // locale-switch / router.refresh and tear down @dnd-kit's sortable items,
  // which kills the active drag and breaks the grip-handle after navigation.
  useEffect(() => {
    setNodes((prev) =>
      nodesStructurallyEqual(prev, initialNodes) ? prev : initialNodes,
    );
  }, [initialNodes]);

  const lastExpandSignal = useRef(expandSignal);
  const lastCollapseSignal = useRef(collapseSignal);

  useEffect(() => {
    if (expandSignal === undefined) return;
    if (expandSignal === lastExpandSignal.current) return;
    lastExpandSignal.current = expandSignal;
    setManualExpanded(new Set(nodes.map((n) => n.id)));
  }, [expandSignal, nodes]);

  useEffect(() => {
    if (collapseSignal === undefined) return;
    if (collapseSignal === lastCollapseSignal.current) return;
    lastCollapseSignal.current = collapseSignal;
    setManualExpanded(new Set());
  }, [collapseSignal]);

  const filter = (externalFilter ?? internalFilter).trim().toLowerCase();
  const filterActive = filter.length > 0;

  const tree = useMemo(() => buildTree(nodes), [nodes]);

  // Continuous lesson sequence numbers in depth-first order across the level
  // (design handoff `.seq`).
  const seqById = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 0;
    const walk = (list: CurriculumTreeNode[]) => {
      for (const n of list) {
        if (n.nodeType === "LESSON") map.set(n.id, ++counter);
        walk(n.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);

  // AREA roots feed the left sidebar; anything else at root level renders in
  // the main panel (fallback for irregular data).
  const areaRoots = useMemo(
    () => tree.filter((n) => n.nodeType === "AREA"),
    [tree],
  );
  const otherRoots = useMemo(
    () => tree.filter((n) => n.nodeType !== "AREA"),
    [tree],
  );
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

  // Build name index per node id for filter matching.
  const nodeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      const name =
        pickTranslation(n.translations, localeUpper)?.name ?? "";
      map.set(n.id, name.toLowerCase());
    }
    return map;
  }, [nodes, localeUpper]);

  // Compute which nodes are visible (themselves or any descendant matches) and which
  // ancestors must be auto-expanded to reveal a match.
  const { visible, autoExpand } = useMemo(() => {
    if (!filterActive) {
      return {
        visible: null as Set<string> | null, // null = show all
        autoExpand: new Set<string>(),
      };
    }
    const visibleSet = new Set<string>();
    const autoExpandSet = new Set<string>();

    const walk = (node: CurriculumTreeNode): boolean => {
      const selfMatch = (nodeNameById.get(node.id) ?? "").includes(filter);
      let anyChildMatch = false;
      for (const child of node.children) {
        const childMatched = walk(child);
        if (childMatched) anyChildMatch = true;
      }
      const matched = selfMatch || anyChildMatch;
      if (matched) {
        visibleSet.add(node.id);
        if (anyChildMatch) autoExpandSet.add(node.id);
      }
      return matched;
    };

    for (const root of tree) walk(root);
    return { visible: visibleSet, autoExpand: autoExpandSet };
  }, [filterActive, filter, tree, nodeNameById]);

  // Active sidebar area: falls back to the first area (or, while filtering,
  // the first area that still has matches).
  const visibleAreas = useMemo(
    () => (visible ? areaRoots.filter((a) => visible.has(a.id)) : areaRoots),
    [areaRoots, visible],
  );
  const activeArea =
    visibleAreas.find((a) => a.id === activeAreaId) ?? visibleAreas[0] ?? null;

  const areaSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleAreaDragEnd = (e: DragEndEvent) => {
    if (filterActive) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = areaRoots.map((a) => a.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    void handleReorder(null, arrayMove(ids, oldIndex, newIndex));
  };

  const isExpanded = (id: string) =>
    autoExpand.has(id) || manualExpanded.has(id);

  const toggleNode = (id: string) => {
    setManualExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allExpanded =
    nodes.length > 0 && nodes.every((n) => manualExpanded.has(n.id));

  const toggleAll = () => {
    if (allExpanded) setManualExpanded(new Set());
    else setManualExpanded(new Set(nodes.map((n) => n.id)));
  };

  const handleReorder = async (
    parentId: string | null,
    newOrderIds: string[],
  ) => {
    setNodes((prev) => {
      const groupIds = new Set(newOrderIds);
      return prev.map((n) => {
        if (!groupIds.has(n.id) || n.parentId !== parentId) return n;
        const newIndex = newOrderIds.indexOf(n.id);
        return { ...n, position: newIndex };
      });
    });
    void handleAction({
      action: () =>
        reorderCurriculumNodesAction({
          curriculumId,
          levelId,
          parentId,
          ids: newOrderIds,
        }),
      successMessage: t("nodesReordered"),
      errorMessage: t("reorderError"),
      onSuccess: () => router.refresh(),
    });
  };

  const handleArchive = async (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    await handleAction({
      action: () => archiveCurriculumNodeAction(id),
      successMessage: t("nodeArchived"),
      errorMessage: t("nodeArchiveError"),
      onSuccess: () => router.refresh(),
    });
  };

  const handleClassificationChange = (
    nodeId: string,
    next: { lessonType?: LessonType | null; lessonScale?: LessonScale | null },
  ) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              ...(next.lessonType !== undefined
                ? { lessonType: next.lessonType }
                : {}),
              ...(next.lessonScale !== undefined
                ? { lessonScale: next.lessonScale }
                : {}),
            }
          : n,
      ),
    );
  };

  const handleUnarchive = async (id: string) => {
    setNodes((prev) => {
      const subtree = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of prev) {
          if (n.parentId && subtree.has(n.parentId) && !subtree.has(n.id)) {
            subtree.add(n.id);
            changed = true;
          }
        }
      }
      return prev.map((n) =>
        subtree.has(n.id) ? { ...n, isArchived: false } : n,
      );
    });
    await handleAction({
      action: () => unarchiveCurriculumNodeAction(id),
      successMessage: t("nodeRestored"),
      errorMessage: t("nodeRestoreError"),
      onSuccess: () => router.refresh(),
    });
  };

  return (
    <div className="space-y-2">
      {!hideToolbar && (
        <div className="flex items-center gap-2 flex-wrap">
          {externalFilter === undefined && (
            <Input
              placeholder={t("filterNodes")}
              value={internalFilter}
              onChange={(e) => setInternalFilter(e.target.value)}
              className="h-9 w-[280px] rounded-full"
            />
          )}
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {allExpanded ? (
              <>
                <ChevronsDownUp className="h-4 w-4 mr-2" />
                {t("collapseAll")}
              </>
            ) : (
              <>
                <ChevronsUpDown className="h-4 w-4 mr-2" />
                {t("expandAll")}
              </>
            )}
          </Button>
        </div>
      )}

      {tree.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t("noNodesYet")}
        </p>
      ) : areaRoots.length > 0 ? (
        <div className="grid items-start gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label={t("areaCount")} className="flex flex-col gap-1">
            <DndContext
              sensors={areaSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleAreaDragEnd}
            >
              <SortableContext
                items={areaRoots.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {areaRoots.map((area, i) => (
                  <SortableAreaItem
                    key={area.id}
                    area={area}
                    active={activeArea?.id === area.id}
                    dimmed={visible ? !visible.has(area.id) : false}
                    dotClass={AREA_DOT_CLASSES[i % AREA_DOT_CLASSES.length]}
                    lessonCount={countDescendants(area, "LESSON")}
                    localeUpper={localeUpper}
                    dragDisabled={filterActive}
                    onSelect={() => setActiveAreaId(area.id)}
                    onEdit={setEditingNode}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </nav>
          <div className="min-w-0 rounded-card border bg-card px-2.5 py-2 shadow-xs">
            {activeArea && activeArea.children.length > 0 ? (
              <SortableGroup
                siblings={activeArea.children}
                parentId={activeArea.id}
                depth={0}
                localeUpper={localeUpper}
                visible={visible}
                seqById={seqById}
                isExpanded={isExpanded}
                onToggle={toggleNode}
                onReorder={handleReorder}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onEdit={setEditingNode}
                onClassificationChange={handleClassificationChange}
                dragDisabled={filterActive}
                allLessons={allLessons}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("noNodesYet")}
              </p>
            )}
            {otherRoots.length > 0 && (
              <SortableGroup
                siblings={otherRoots}
                parentId={null}
                depth={0}
                localeUpper={localeUpper}
                visible={visible}
                seqById={seqById}
                isExpanded={isExpanded}
                onToggle={toggleNode}
                onReorder={handleReorder}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onEdit={setEditingNode}
                onClassificationChange={handleClassificationChange}
                dragDisabled={filterActive}
                allLessons={allLessons}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-card border bg-card px-2.5 py-2 shadow-xs">
          <SortableGroup
            siblings={tree}
            parentId={null}
            depth={0}
            localeUpper={localeUpper}
            visible={visible}
            seqById={seqById}
            isExpanded={isExpanded}
            onToggle={toggleNode}
            onReorder={handleReorder}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onEdit={setEditingNode}
            onClassificationChange={handleClassificationChange}
            dragDisabled={filterActive}
            allLessons={allLessons}
          />
        </div>
      )}
      {editingNode && (
        <CurriculumNodeTranslationsDialog
          open={true}
          onOpenChange={(open) => !open && setEditingNode(null)}
          node={editingNode}
          onSaved={(nodeId, locale, translation) => {
            setNodes((prev) =>
              prev.map((n) => {
                if (n.id !== nodeId) return n;
                const others = n.translations.filter(
                  (tr) => tr.locale !== locale,
                );
                return {
                  ...n,
                  translations: [
                    ...others,
                    {
                      locale,
                      name: translation.name,
                      notes: translation.notes,
                    },
                  ],
                };
              }),
            );
            setEditingNode((curr) =>
              curr && curr.id === nodeId
                ? {
                    ...curr,
                    translations: [
                      ...curr.translations.filter((tr) => tr.locale !== locale),
                      {
                        locale,
                        name: translation.name,
                        notes: translation.notes,
                      },
                    ],
                  }
                : curr,
            );
          }}
        />
      )}
    </div>
  );
}

interface SortableGroupProps {
  siblings: CurriculumTreeNode[];
  parentId: string | null;
  depth: number;
  localeUpper: CurriculumLocale;
  visible: Set<string> | null;
  seqById: Map<string, number>;
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
  onReorder: (parentId: string | null, ids: string[]) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onEdit: (node: CurriculumNodeDTO) => void;
  onClassificationChange: (
    nodeId: string,
    next: { lessonType?: LessonType | null; lessonScale?: LessonScale | null },
  ) => void;
  dragDisabled: boolean;
  allLessons?: LessonOption[];
}

function SortableGroup({
  siblings,
  parentId,
  depth,
  localeUpper,
  visible,
  seqById,
  isExpanded,
  onToggle,
  onReorder,
  onArchive,
  onUnarchive,
  onEdit,
  onClassificationChange,
  dragDisabled,
  allLessons,
}: SortableGroupProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const visibleSiblings = useMemo(
    () => (visible ? siblings.filter((s) => visible.has(s.id)) : siblings),
    [siblings, visible],
  );

  const handleDragEnd = (e: DragEndEvent) => {
    if (dragDisabled) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = siblings.map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    onReorder(parentId, next);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleSiblings.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {visibleSiblings.map((node) => {
          const expanded = isExpanded(node.id);
          return (
            <SortableNodeRow
              key={node.id}
              node={node}
              depth={depth}
              localeUpper={localeUpper}
              seqById={seqById}
              expanded={expanded}
              onToggle={() => onToggle(node.id)}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
              onEdit={onEdit}
              onClassificationChange={onClassificationChange}
              dragDisabled={dragDisabled}
              allLessons={allLessons}
            >
              {node.children.length > 0 && expanded && (
                <SortableGroup
                  siblings={node.children}
                  parentId={node.id}
                  depth={depth + 1}
                  localeUpper={localeUpper}
                  visible={visible}
                  seqById={seqById}
                  isExpanded={isExpanded}
                  onToggle={onToggle}
                  onReorder={onReorder}
                  onArchive={onArchive}
                  onUnarchive={onUnarchive}
                  onEdit={onEdit}
                  onClassificationChange={onClassificationChange}
                  dragDisabled={dragDisabled}
                  allLessons={allLessons}
                />
              )}
            </SortableNodeRow>
          );
        })}
      </SortableContext>
    </DndContext>
  );
}

interface SortableNodeRowProps {
  node: CurriculumTreeNode;
  depth: number;
  localeUpper: CurriculumLocale;
  seqById: Map<string, number>;
  expanded: boolean;
  onToggle: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onEdit: (node: CurriculumNodeDTO) => void;
  onClassificationChange: (
    nodeId: string,
    next: { lessonType?: LessonType | null; lessonScale?: LessonScale | null },
  ) => void;
  dragDisabled: boolean;
  allLessons?: LessonOption[];
  children?: React.ReactNode;
}

function SortableNodeRow({
  node,
  depth,
  localeUpper,
  seqById,
  expanded,
  onToggle,
  onArchive,
  onUnarchive,
  onEdit,
  onClassificationChange,
  dragDisabled,
  allLessons,
  children,
}: SortableNodeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: depth * 14,
  };

  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const name =
    pickTranslation(node.translations, localeUpper)?.name ?? "(untitled)";
  const hasChildren = node.children.length > 0;
  const availableLocales = new Set(node.translations.map((tr) => tr.locale));
  const ALL_LOCALES: CurriculumLocale[] = ["DE", "FR", "IT", "EN"];

  const archivedRow = node.isArchived;

  const isLesson = node.nodeType === "LESSON";
  const isGroup = node.nodeType === "GROUP";
  const isTopicLike = node.nodeType === "TOPIC" || node.nodeType === "AREA";
  const seq = seqById.get(node.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "opacity-50",
        isTopicLike && depth === 0 && "border-b last:border-b-0",
      )}
    >
      <div
        aria-label={t(NODE_TYPE_I18N_KEY[node.nodeType])}
        className={cn(
          "group flex items-center gap-2 transition-colors hover:bg-row-hover",
          isTopicLike && "rounded-lg px-2 py-2",
          isGroup && "rounded-md px-2 pt-2.5 pb-1",
          isLesson && "rounded-[7px] px-2 py-1.5",
          archivedRow && "opacity-50",
        )}
      >
        <span
          {...attributes}
          {...listeners}
          className={cn(
            "shrink-0 p-1 text-muted-foreground transition-opacity",
            dragDisabled
              ? "opacity-0 group-hover:opacity-30"
              : "cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing",
          )}
          aria-label="drag"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onToggle}
            aria-label={expanded ? tCommon("collapse") : tCommon("expand")}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                expanded && "rotate-90",
              )}
            />
          </Button>
        ) : !isLesson ? (
          <span className="inline-block h-6 w-6 shrink-0" />
        ) : null}
        {isLesson && (
          <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
            {seq}
          </span>
        )}
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center text-left"
          >
            <NodeName node={node} name={name} />
          </button>
        ) : (
          <span className="flex min-w-0 flex-1 items-center">
            <NodeName node={node} name={name} />
          </span>
        )}
        {isTopicLike && (
          <span className="shrink-0 font-mono text-[11.5px] whitespace-nowrap text-muted-foreground">
            {t("topicMeta", {
              groups: countDescendants(node, "GROUP"),
              lessons: countDescendants(node, "LESSON"),
            })}
          </span>
        )}
        {isGroup && (
          <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
            {node.children.length}
          </span>
        )}
        {isLesson && !archivedRow && (
          <LessonClassificationBadges
            nodeId={node.id}
            lessonType={node.lessonType}
            lessonScale={node.lessonScale}
            onChange={(next) => onClassificationChange(node.id, next)}
          />
        )}
        <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {ALL_LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              className="transition-opacity hover:opacity-80"
              title={`${t(`locale${loc}`)} – ${t("editTranslations")}`}
              aria-label={`${t(`locale${loc}`)} – ${t("editTranslations")}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
            >
              <LocaleBadge locale={loc} active={availableLocales.has(loc)} />
            </button>
          ))}
        </span>
        {node.nodeType === "LESSON" && allLessons && !archivedRow && (
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <PrerequisitesEditor lessonId={node.id} allLessons={allLessons} />
          </span>
        )}
        {archivedRow ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onUnarchive(node.id);
            }}
            aria-label={t("restoreNode")}
            title={t("restoreNode")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <ArchiveConfirmationDialog
            title={t("archiveNodeTitle")}
            description={t("archiveNodeDescription")}
            onConfirm={async () => {
              await onArchive(node.id);
              return { success: true };
            }}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                aria-label={tCommon("archive")}
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            }
          />
        )}
      </div>
      {children}
    </div>
  );
}

interface SortableAreaItemProps {
  area: CurriculumTreeNode;
  active: boolean;
  /** True while a filter is active and this area has no matches. */
  dimmed: boolean;
  dotClass: string;
  lessonCount: number;
  localeUpper: CurriculumLocale;
  dragDisabled: boolean;
  onSelect: () => void;
  onEdit: (node: CurriculumNodeDTO) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}

/**
 * Sidebar entry for an AREA root (design handoff `.cu-area`): color dot,
 * name and lesson count; active area gets the elevated card look. Reorder,
 * translations and archive/restore stay available via hover actions.
 */
function SortableAreaItem({
  area,
  active,
  dimmed,
  dotClass,
  lessonCount,
  localeUpper,
  dragDisabled,
  onSelect,
  onEdit,
  onArchive,
  onUnarchive,
}: SortableAreaItemProps) {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: area.id, disabled: dragDisabled });

  const name =
    pickTranslation(area.translations, localeUpper)?.name ?? "(untitled)";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group/area relative", isDragging && "opacity-50")}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-ctl px-3 py-2.5 text-left text-[13.5px] transition-colors",
          active
            ? "border bg-card font-[650] shadow-xs"
            : "font-medium text-muted-foreground hover:bg-row-hover",
          (dimmed || area.isArchived) && "opacity-50",
        )}
      >
        <span className={cn("size-2.5 shrink-0 rounded-[4px]", dotClass)} />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground transition-opacity group-hover/area:opacity-0">
          {lessonCount}
        </span>
      </button>
      <span className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-focus-within/area:opacity-100 group-hover/area:opacity-100">
        <span
          {...attributes}
          {...listeners}
          className={cn(
            "p-1 text-muted-foreground",
            dragDisabled
              ? "opacity-30"
              : "cursor-grab active:cursor-grabbing",
          )}
          aria-label="drag"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(area);
          }}
          aria-label={t("editTranslations")}
          title={t("editTranslations")}
        >
          <Languages className="h-3.5 w-3.5" />
        </Button>
        {area.isArchived ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onUnarchive(area.id);
            }}
            aria-label={t("restoreNode")}
            title={t("restoreNode")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <ArchiveConfirmationDialog
            title={t("archiveNodeTitle")}
            description={t("archiveNodeDescription")}
            onConfirm={async () => {
              await onArchive(area.id);
              return { success: true };
            }}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label={tCommon("archive")}
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            }
          />
        )}
      </span>
    </div>
  );
}
