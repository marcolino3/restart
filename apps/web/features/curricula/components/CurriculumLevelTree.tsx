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
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { ArchiveConfirmationDialog } from "@/components/common/ArchiveConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleAction } from "@/lib/actions/handle-action";
import { archiveCurriculumNodeAction } from "../actions/archive-curriculum-node.action";
import { unarchiveCurriculumNodeAction } from "../actions/unarchive-curriculum-node.action";
import { reorderCurriculumNodesAction } from "../actions/reorder-curriculum-nodes.action";
import {
  buildTree,
  pickTranslation,
  type CurriculumLocale,
  type CurriculumNodeDTO,
  type CurriculumTreeNode,
} from "../types";
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

const LOCALE_PRESENT_CLS: Record<CurriculumLocale, string> = {
  DE: "bg-amber-600 text-white",
  FR: "bg-blue-600 text-white",
  IT: "bg-emerald-600 text-white",
  EN: "bg-violet-600 text-white",
};

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

  useEffect(() => {
    setNodes(initialNodes);
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
              className="max-w-sm h-8"
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
      ) : (
        <div className="space-y-1">
          <SortableGroup
            siblings={tree}
            parentId={null}
            depth={0}
            localeUpper={localeUpper}
            visible={visible}
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
    paddingLeft: depth * 24,
  };

  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const name =
    pickTranslation(node.translations, localeUpper)?.name ?? "(untitled)";
  const hasChildren = node.children.length > 0;
  const availableLocales = new Set(node.translations.map((tr) => tr.locale));
  const ALL_LOCALES: CurriculumLocale[] = ["DE", "FR", "IT", "EN"];

  const archivedRow = node.isArchived;

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 hover:bg-accent rounded-md transition-colors group ${archivedRow ? "opacity-50" : ""}`}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
            aria-label={expanded ? tCommon("collapse") : tCommon("expand")}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        ) : (
          <span className="inline-block h-6 w-6" />
        )}
        <span
          {...attributes}
          {...listeners}
          className={
            dragDisabled
              ? "p-1 text-muted-foreground opacity-30"
              : "cursor-grab active:cursor-grabbing p-1 text-muted-foreground"
          }
          aria-label="drag"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {t(NODE_TYPE_I18N_KEY[node.nodeType])}
        </span>
        <span className="flex-1 truncate text-sm">{name}</span>
        {node.nodeType === "LESSON" && !archivedRow && (
          <LessonClassificationBadges
            nodeId={node.id}
            lessonType={node.lessonType}
            lessonScale={node.lessonScale}
            onChange={(next) => onClassificationChange(node.id, next)}
          />
        )}
        <span className="flex items-center gap-1">
          {ALL_LOCALES.map((loc) => {
            const present = availableLocales.has(loc);
            const baseCls =
              "text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded cursor-pointer transition-opacity hover:opacity-80";
            const colorCls = present
              ? LOCALE_PRESENT_CLS[loc]
              : "bg-muted text-muted-foreground/60";
            return (
              <button
                key={loc}
                type="button"
                className={`${baseCls} ${colorCls}`}
                title={`${t(`locale${loc}`)} – ${t("editTranslations")}`}
                aria-label={`${t(`locale${loc}`)} – ${t("editTranslations")}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node);
                }}
              >
                {t(`locale${loc}`)}
              </button>
            );
          })}
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
