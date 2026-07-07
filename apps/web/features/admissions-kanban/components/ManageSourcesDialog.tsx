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
  archiveAdmissionSourceAction,
  createAdmissionSourceAction,
  reorderAdmissionSourcesAction,
  updateAdmissionSourceAction,
} from "../actions/sources-actions";
import type { AdmissionSource } from "../types";

interface Props {
  sources: AdmissionSource[];
  onClose: () => void;
}

export function ManageSourcesDialog({
  sources: initialSources,
  onClose,
}: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [sources, setSources] = useState<AdmissionSource[]>(initialSources);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#0EA5E9");
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error(t("sourceNameRequired"));
      return;
    }
    setBusy(true);
    const maxPos = sources.reduce((m, s) => Math.max(m, s.position), -1);
    const res = await createAdmissionSourceAction({
      name,
      color: newColor,
      position: maxPos + 1,
    });
    setBusy(false);
    if (res.success) {
      setSources((prev) => [...prev, res.data]);
      setNewName("");
      toast.success(t("sourceSaved"));
      router.refresh();
    } else {
      toast.error(t("sourceError"), { description: res.error });
    }
  };

  const onArchive = async (id: string) => {
    if (!window.confirm(t("sourceArchiveConfirm"))) return;
    setBusy(true);
    const res = await archiveAdmissionSourceAction(id);
    setBusy(false);
    if (res.success) {
      setSources((prev) => prev.filter((s) => s.id !== id));
      toast.success(t("sourceArchived"));
      router.refresh();
    } else {
      toast.error(t("sourceError"), { description: res.error });
    }
  };

  const onUpdateColor = async (id: string, color: string) => {
    const original = sources.find((s) => s.id === id);
    if (!original || original.color === color) return;
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s)),
    );
    const res = await updateAdmissionSourceAction({ id, color });
    if (!res.success) {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, color: original.color } : s)),
      );
      toast.error(t("sourceError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const onRename = async (id: string, name: string) => {
    const original = sources.find((s) => s.id === id);
    const trimmed = name.trim();
    if (!original || !trimmed || original.name === trimmed) return;
    const res = await updateAdmissionSourceAction({ id, name: trimmed });
    if (!res.success) {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: original.name } : s)),
      );
      toast.error(t("sourceError"), { description: res.error });
    } else {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: trimmed } : s)),
      );
      router.refresh();
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const fromIdx = sources.findIndex((s) => s.id === active.id);
    const toIdx = sources.findIndex((s) => s.id === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...sources];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const prev = sources;
    setSources(next);
    setBusy(true);
    const res = await reorderAdmissionSourcesAction(next.map((s) => s.id));
    setBusy(false);
    if (!res.success) {
      setSources(prev);
      toast.error(t("sourceError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("manageSources")}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <section className="space-y-2 rounded-md border p-3">
            <h3 className="text-sm font-semibold">{t("newSource")}</h3>
            <p className="text-xs text-muted-foreground">{t("sourcesHint")}</p>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-[7px]">
                <Label className="text-[12.5px] font-semibold">
                  {t("sourceName")}
                </Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("sourceNamePlaceholder")}
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
                {t("newSource")}
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("existingSources", { count: sources.length })}
            </h3>
            {sources.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">
                {t("noSources")}
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={sources.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y rounded-md border">
                    {sources.map((s) => (
                      <SortableSourceRow
                        key={s.id}
                        source={s}
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

interface SortableSourceRowProps {
  source: AdmissionSource;
  busy: boolean;
  onUpdateColor: (id: string, color: string) => void;
  onRename: (id: string, name: string) => void;
  onArchive: (id: string) => void;
}

function SortableSourceRow({
  source: s,
  busy,
  onUpdateColor,
  onRename,
  onArchive,
}: SortableSourceRowProps) {
  const t = useTranslations("Admissions");
  const [name, setName] = useState(s.name);
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
          aria-label={t("dragSource")}
          title={t("dragSource")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <ColorPicker
          size="sm"
          value={s.color}
          onChange={(v) => onUpdateColor(s.id, v ?? "#0EA5E9")}
          disabled={busy}
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onRename(s.id, name)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-8 flex-1"
          disabled={busy}
        />
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
    </div>
  );
}
