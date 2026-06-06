"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { updateBoardSettingsAction } from "../actions/board-settings-actions";
import {
  archiveAdmissionStageAction,
  createAdmissionStageAction,
  reorderAdmissionStagesAction,
  updateAdmissionStageAction,
} from "../actions/stage-actions";
import {
  CARD_FIELD_KEYS,
  CARD_FIELD_LABEL,
  resolveCardFields,
  resolveTableColumns,
  TABLE_COLUMN_KEYS,
  TABLE_COLUMN_LABEL,
  type CardFieldKey,
  type TableColumnKey,
} from "../field-registry";
import type { KanbanStage } from "../types";

/** Keeps a selection in the canonical key order (v1 supports on/off, not reorder). */
const orderedSubset = <T extends string>(
  all: readonly T[],
  selected: Set<T>,
): T[] => all.filter((k) => selected.has(k));

type StageType =
  | "INITIAL"
  | "IN_PROGRESS"
  | "ACCEPTED"
  | "ENROLLED"
  | "REJECTED";

interface Props {
  stages: KanbanStage[];
  tableColumns: string[] | null;
  onClose: () => void;
}

export function ManageStagesDialog({
  stages: initialStages,
  tableColumns: initialTableColumns,
  onClose,
}: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [stages, setStages] = useState<KanbanStage[]>(initialStages);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#0EA5E9");
  const [newType, setNewType] = useState<StageType>("IN_PROGRESS");
  const [busy, setBusy] = useState(false);

  // Which stage's card-field editor is expanded.
  const [editingFieldsFor, setEditingFieldsFor] = useState<string | null>(null);
  // Org-global table columns (canonical order).
  const [tableCols, setTableCols] = useState<TableColumnKey[]>(
    resolveTableColumns(initialTableColumns),
  );

  const onToggleCardField = async (stage: KanbanStage, key: CardFieldKey) => {
    const current = new Set(resolveCardFields(stage.cardFields));
    if (current.has(key)) current.delete(key);
    else current.add(key);
    const next = orderedSubset(CARD_FIELD_KEYS, current);
    const prev = stages;
    setStages((p) =>
      p.map((s) => (s.id === stage.id ? { ...s, cardFields: next } : s)),
    );
    const res = await updateAdmissionStageAction({ id: stage.id, cardFields: next });
    if (!res.success) {
      setStages(prev);
      toast.error(t("stageUpdateError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const onToggleTableColumn = async (key: TableColumnKey) => {
    const current = new Set(tableCols);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    const next = orderedSubset(TABLE_COLUMN_KEYS, current);
    const prev = tableCols;
    setTableCols(next);
    const res = await updateBoardSettingsAction(next);
    if (!res.success) {
      setTableCols(prev);
      toast.error(t("stageUpdateError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error(t("stageNameRequired"));
      return;
    }
    const slug = slugify(name);
    if (!slug) {
      toast.error(t("stageSlugInvalid"));
      return;
    }
    setBusy(true);
    const maxPos = stages.reduce((m, s) => Math.max(m, s.position), -1);
    const res = await createAdmissionStageAction({
      name,
      slug,
      color: newColor,
      stageType: newType,
      position: maxPos + 1,
    });
    setBusy(false);
    if (res.success) {
      setStages((prev) => [...prev, res.data]);
      setNewName("");
      toast.success(t("stageCreated"));
      router.refresh();
    } else {
      toast.error(t("stageCreateError"), { description: res.error });
    }
  };

  const onArchive = async (id: string) => {
    if (!window.confirm(t("stageArchiveConfirm"))) return;
    setBusy(true);
    const res = await archiveAdmissionStageAction(id);
    setBusy(false);
    if (res.success) {
      setStages((prev) => prev.filter((s) => s.id !== id));
      toast.success(t("stageArchived"));
      router.refresh();
    } else {
      toast.error(t("stageArchiveError"), { description: res.error });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const fromIdx = stages.findIndex((s) => s.id === active.id);
    const toIdx = stages.findIndex((s) => s.id === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...stages];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const prev = stages;
    setStages(next);
    setBusy(true);
    const res = await reorderAdmissionStagesAction(next.map((s) => s.id));
    setBusy(false);
    if (!res.success) {
      setStages(prev); // rollback
      toast.error(t("stageReorderError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const onUpdateColor = async (id: string, color: string) => {
    const original = stages.find((s) => s.id === id);
    if (!original || original.color === color) return;
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s)),
    );
    const res = await updateAdmissionStageAction({ id, color });
    if (!res.success) {
      setStages((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, color: original.color } : s,
        ),
      );
      toast.error(t("stageUpdateError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const stageTypeOptions: { value: StageType; label: string }[] = [
    { value: "INITIAL", label: t("stageTypeInitial") },
    { value: "IN_PROGRESS", label: t("stageTypeInProgress") },
    { value: "ACCEPTED", label: t("stageTypeAccepted") },
    { value: "ENROLLED", label: t("stageTypeEnrolled") },
    { value: "REJECTED", label: t("stageTypeRejected") },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t("manageStages")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <section className="space-y-2 rounded-md border p-3">
            <h3 className="text-sm font-semibold">{t("addStage")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("addStageHint")}
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">{t("stageName")}</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("stageNamePlaceholder")}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("stageType")}</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => setNewType(v as StageType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stageTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("stageColor")}</Label>
                <ColorPicker
                  value={newColor}
                  onChange={(v) => setNewColor(v ?? "#94A3B8")}
                />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  onClick={onCreate}
                  disabled={busy || !newName.trim()}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t("addStage")}
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("existingStages", { count: stages.length })}
            </h3>
            {stages.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">
                {t("noStages")}
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={stages.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y rounded-md border">
                    {stages.map((s) => (
                      <SortableStageRow
                        key={s.id}
                        stage={s}
                        busy={busy}
                        editing={editingFieldsFor === s.id}
                        stageTypeLabel={
                          stageTypeOptions.find((o) => o.value === s.stageType)
                            ?.label ?? s.stageType
                        }
                        onToggleEditing={() =>
                          setEditingFieldsFor(
                            editingFieldsFor === s.id ? null : s.id,
                          )
                        }
                        onUpdateColor={onUpdateColor}
                        onArchive={onArchive}
                        onToggleCardField={onToggleCardField}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>

          <section className="space-y-2 rounded-md border p-3">
            <h3 className="text-sm font-semibold">{t("tableColumnsTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("tableColumnsHint")}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {TABLE_COLUMN_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-xs"
                >
                  <Checkbox
                    checked={tableCols.includes(key)}
                    onCheckedChange={() => onToggleTableColumn(key)}
                  />
                  {t(TABLE_COLUMN_LABEL[key])}
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              {tC("close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SortableStageRowProps {
  stage: KanbanStage;
  busy: boolean;
  editing: boolean;
  stageTypeLabel: string;
  onToggleEditing: () => void;
  onUpdateColor: (id: string, color: string) => void;
  onArchive: (id: string) => void;
  onToggleCardField: (stage: KanbanStage, key: CardFieldKey) => void;
}

function SortableStageRow({
  stage: s,
  busy,
  editing,
  stageTypeLabel,
  onToggleEditing,
  onUpdateColor,
  onArchive,
  onToggleCardField,
}: SortableStageRowProps) {
  const t = useTranslations("Admissions");
  const stageFields = new Set(resolveCardFields(s.cardFields));
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: s.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "relative z-10 bg-background opacity-80" : ""}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={busy}
          className="shrink-0 cursor-grab rounded text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing disabled:cursor-not-allowed"
          aria-label={t("dragStage")}
          title={t("dragStage")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <ColorPicker
          size="sm"
          value={s.color}
          onChange={(v) => onUpdateColor(s.id, v ?? "#94A3B8")}
          disabled={busy}
        />
        <div className="flex-1">
          <div className="text-sm font-medium">{s.name}</div>
          <div className="text-[10px] text-muted-foreground">{s.slug}</div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {stageTypeLabel}
        </Badge>
        {s.isDefault && (
          <Badge variant="secondary" className="text-[10px]">
            {t("stageDefault")}
          </Badge>
        )}
        <Button
          size="icon"
          variant={editing ? "secondary" : "ghost"}
          onClick={onToggleEditing}
          className="h-7 w-7"
          aria-label={t("cardFieldsTitle")}
          title={t("cardFieldsTitle")}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onArchive(s.id)}
          disabled={busy}
          className="h-7 w-7 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {editing && (
        <div className="bg-muted/30 px-3 py-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {t("cardFieldsHint")}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {CARD_FIELD_KEYS.map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 text-xs"
              >
                <Checkbox
                  checked={stageFields.has(key)}
                  onCheckedChange={() => onToggleCardField(s, key)}
                />
                {t(CARD_FIELD_LABEL[key])}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
