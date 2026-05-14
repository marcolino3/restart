"use client";

import { useEffect, useState } from "react";
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
import { Archive, GripVertical, Languages, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleAction } from "@/lib/actions/handle-action";
import { archiveCurriculumNodeAction } from "../actions/archive-curriculum-node.action";
import { reorderCurriculumNodesAction } from "../actions/reorder-curriculum-nodes.action";
import {
  buildTree,
  pickTranslation,
  type CurriculumLocale,
  type CurriculumNodeDTO,
  type CurriculumTreeNode,
} from "../types";
import { CurriculumNodeTranslationsDialog } from "./CurriculumNodeTranslationsDialog";

interface Props {
  curriculumId: string;
  levelId: string;
  initialNodes: CurriculumNodeDTO[];
}

const NODE_TYPE_LABEL: Record<CurriculumTreeNode["nodeType"], string> = {
  AREA: "Area",
  TOPIC: "Topic",
  PRESENTATION: "Presentation",
  WORK: "Work",
};

export function CurriculumLevelTree({
  curriculumId,
  levelId,
  initialNodes,
}: Props) {
  const t = useTranslations("Curricula");
  const router = useRouter();
  const locale = useLocale();
  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  const [nodes, setNodes] = useState<CurriculumNodeDTO[]>(initialNodes);
  const [editingNode, setEditingNode] = useState<CurriculumNodeDTO | null>(
    null,
  );

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  const tree = buildTree(nodes);

  const handleReorder = async (
    parentId: string | null,
    newOrderIds: string[],
  ) => {
    // Optimistic local re-order
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
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

  if (tree.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {t("noNodesYet")}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <SortableGroup
        siblings={tree}
        parentId={null}
        depth={0}
        localeUpper={localeUpper}
        onReorder={handleReorder}
        onArchive={handleArchive}
        onEdit={setEditingNode}
      />
      {editingNode && (
        <CurriculumNodeTranslationsDialog
          open={true}
          onOpenChange={(open) => !open && setEditingNode(null)}
          node={editingNode}
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
  onReorder: (parentId: string | null, ids: string[]) => void;
  onArchive: (id: string) => void;
  onEdit: (node: CurriculumNodeDTO) => void;
}

function SortableGroup({
  siblings,
  parentId,
  depth,
  localeUpper,
  onReorder,
  onArchive,
  onEdit,
}: SortableGroupProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
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
        items={siblings.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {siblings.map((node) => (
          <SortableNodeRow
            key={node.id}
            node={node}
            depth={depth}
            localeUpper={localeUpper}
            onArchive={onArchive}
            onEdit={onEdit}
          >
            {node.children.length > 0 && (
              <SortableGroup
                siblings={node.children}
                parentId={node.id}
                depth={depth + 1}
                localeUpper={localeUpper}
                onReorder={onReorder}
                onArchive={onArchive}
                onEdit={onEdit}
              />
            )}
          </SortableNodeRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}

interface SortableNodeRowProps {
  node: CurriculumTreeNode;
  depth: number;
  localeUpper: CurriculumLocale;
  onArchive: (id: string) => void;
  onEdit: (node: CurriculumNodeDTO) => void;
  children?: React.ReactNode;
}

function SortableNodeRow({
  node,
  depth,
  localeUpper,
  onArchive,
  onEdit,
  children,
}: SortableNodeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: depth * 24,
  };

  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const name =
    pickTranslation(node.translations, localeUpper)?.name ?? "(untitled)";
  const missingLocales = (
    ["DE", "FR", "EN", "IT"] as CurriculumLocale[]
  ).filter((l) => !node.translations.some((tr) => tr.locale === l));

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/40 rounded group">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground"
          aria-label="drag"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {NODE_TYPE_LABEL[node.nodeType]}
        </span>
        <span className="flex-1 truncate text-sm">{name}</span>
        {missingLocales.length > 0 && (
          <span
            className="text-[10px] text-amber-700 dark:text-amber-400"
            title={`${t("missingLocales")}: ${missingLocales.join(", ")}`}
          >
            {missingLocales.join("/")}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100"
          onClick={() => onEdit(node)}
          aria-label={t("editTranslations")}
        >
          <Languages className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
          onClick={() => onArchive(node.id)}
          aria-label={tCommon("archive")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {children}
    </div>
  );
}
