"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical, Plus, Trash2 } from "lucide-react";
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

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  archiveStudentRecordCategoryAction,
  createStudentRecordCategoryAction,
  reorderStudentRecordCategoriesAction,
  updateStudentRecordCategoryAction,
  type StudentRecordCategory,
} from "../actions/record-categories-actions";

interface Props {
  categories: StudentRecordCategory[];
  studentId: string;
  onClose: () => void;
}

export function ManageRecordCategoriesDialog({
  categories: initial,
  studentId,
  onClose,
}: Props) {
  const t = useTranslations("StudentRecords");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [categories, setCategories] = useState<StudentRecordCategory[]>(initial);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#0EA5E9");
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error(t("categoryNameRequired"));
      return;
    }
    setBusy(true);
    const maxPos = categories.reduce((m, c) => Math.max(m, c.position), -1);
    const res = await createStudentRecordCategoryAction(
      { name, color: newColor, position: maxPos + 1 },
      studentId,
    );
    setBusy(false);
    if (res.success) {
      setCategories((prev) => [...prev, res.data]);
      setNewName("");
      toast.success(t("categorySaved"));
      router.refresh();
    } else {
      toast.error(t("categoryError"), { description: res.error });
    }
  };

  const onArchive = async (id: string) => {
    if (!window.confirm(t("categoryArchiveConfirm"))) return;
    setBusy(true);
    const res = await archiveStudentRecordCategoryAction(id, studentId);
    setBusy(false);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success(t("categoryArchived"));
      router.refresh();
    } else {
      toast.error(t("categoryError"), { description: res.error });
    }
  };

  const onUpdateColor = async (id: string, color: string) => {
    const original = categories.find((c) => c.id === id);
    if (!original || original.color === color) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, color } : c)),
    );
    const res = await updateStudentRecordCategoryAction({ id, color }, studentId);
    if (!res.success) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, color: original.color } : c)),
      );
      toast.error(t("categoryError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const onRename = async (id: string, name: string) => {
    const original = categories.find((c) => c.id === id);
    const trimmed = name.trim();
    if (!original || !trimmed || original.name === trimmed) return;
    const res = await updateStudentRecordCategoryAction(
      { id, name: trimmed },
      studentId,
    );
    if (!res.success) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: original.name } : c)),
      );
      toast.error(t("categoryError"), { description: res.error });
    } else {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
      );
      router.refresh();
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const fromIdx = categories.findIndex((c) => c.id === active.id);
    const toIdx = categories.findIndex((c) => c.id === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...categories];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const prev = categories;
    setCategories(next);
    setBusy(true);
    const res = await reorderStudentRecordCategoriesAction(
      next.map((c) => c.id),
      studentId,
    );
    setBusy(false);
    if (!res.success) {
      setCategories(prev);
      toast.error(t("categoryError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("manageCategories")}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <section className="space-y-2 rounded-md border p-3">
            <h3 className="text-sm font-semibold">{t("newCategory")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("categoriesHint")}
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-[7px]">
                <Label className="text-[12.5px] font-semibold">
                  {t("categoryName")}
                </Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("categoryNamePlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !busy && newName.trim())
                      onCreate();
                  }}
                />
              </div>
              <ColorPicker
                value={newColor}
                onChange={(v) => setNewColor(v ?? "#0EA5E9")}
              />
              <Button
                size="sm"
                onClick={onCreate}
                disabled={busy || !newName.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("newCategory")}
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("existingCategories", { count: categories.length })}
            </h3>
            {categories.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">
                {t("noCategories")}
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y rounded-md border">
                    {categories.map((c) => (
                      <SortableCategoryRow
                        key={c.id}
                        category={c}
                        busy={busy}
                        onUpdateColor={onUpdateColor}
                        onRename={onRename}
                        onArchive={onArchive}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tC("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SortableCategoryRowProps {
  category: StudentRecordCategory;
  busy: boolean;
  onUpdateColor: (id: string, color: string) => void;
  onRename: (id: string, name: string) => void;
  onArchive: (id: string) => void;
}

function SortableCategoryRow({
  category: c,
  busy,
  onUpdateColor,
  onRename,
  onArchive,
}: SortableCategoryRowProps) {
  const t = useTranslations("StudentRecords");
  const [name, setName] = useState(c.name);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c.id });
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
          aria-label={t("dragCategory")}
          title={t("dragCategory")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <ColorPicker
          size="sm"
          value={c.color}
          onChange={(v) => onUpdateColor(c.id, v ?? "#0EA5E9")}
          disabled={busy}
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onRename(c.id, name)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-8 flex-1"
          disabled={busy}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onArchive(c.id)}
          disabled={busy}
          className="h-7 w-7 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
