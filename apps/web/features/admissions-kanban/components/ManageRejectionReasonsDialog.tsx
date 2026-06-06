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
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  archiveAdmissionRejectionReasonAction,
  createAdmissionRejectionReasonAction,
  reorderAdmissionRejectionReasonsAction,
  updateAdmissionRejectionReasonAction,
} from "../actions/rejection-reasons-actions";
import type { AdmissionRejectionReason } from "../types";

interface Props {
  reasons: AdmissionRejectionReason[];
  onClose: () => void;
}

export function ManageRejectionReasonsDialog({
  reasons: initialReasons,
  onClose,
}: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [reasons, setReasons] =
    useState<AdmissionRejectionReason[]>(initialReasons);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#EF4444");
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onCreate = async () => {
    const label = newLabel.trim();
    if (!label) {
      toast.error(t("rejectionReasonLabelRequired"));
      return;
    }
    setBusy(true);
    const maxPos = reasons.reduce((m, r) => Math.max(m, r.position), -1);
    const res = await createAdmissionRejectionReasonAction({
      label,
      color: newColor,
      position: maxPos + 1,
    });
    setBusy(false);
    if (res.success) {
      setReasons((prev) => [...prev, res.data]);
      setNewLabel("");
      toast.success(t("rejectionReasonCreated"));
      router.refresh();
    } else {
      toast.error(t("rejectionReasonCreateError"), { description: res.error });
    }
  };

  const onArchive = async (id: string) => {
    if (!window.confirm(t("rejectionReasonArchiveConfirm"))) return;
    setBusy(true);
    const res = await archiveAdmissionRejectionReasonAction(id);
    setBusy(false);
    if (res.success) {
      setReasons((prev) => prev.filter((r) => r.id !== id));
      toast.success(t("rejectionReasonArchived"));
      router.refresh();
    } else {
      toast.error(t("rejectionReasonArchiveError"), { description: res.error });
    }
  };

  const onUpdateColor = async (id: string, color: string) => {
    const original = reasons.find((r) => r.id === id);
    if (!original || original.color === color) return;
    setReasons((prev) =>
      prev.map((r) => (r.id === id ? { ...r, color } : r)),
    );
    const res = await updateAdmissionRejectionReasonAction({ id, color });
    if (!res.success) {
      setReasons((prev) =>
        prev.map((r) => (r.id === id ? { ...r, color: original.color } : r)),
      );
      toast.error(t("rejectionReasonUpdateError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const onRename = async (id: string, label: string) => {
    const original = reasons.find((r) => r.id === id);
    const trimmed = label.trim();
    if (!original || !trimmed || original.label === trimmed) return;
    const res = await updateAdmissionRejectionReasonAction({
      id,
      label: trimmed,
    });
    if (!res.success) {
      setReasons((prev) =>
        prev.map((r) => (r.id === id ? { ...r, label: original.label } : r)),
      );
      toast.error(t("rejectionReasonUpdateError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const fromIdx = reasons.findIndex((r) => r.id === active.id);
    const toIdx = reasons.findIndex((r) => r.id === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...reasons];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const prev = reasons;
    setReasons(next);
    setBusy(true);
    const res = await reorderAdmissionRejectionReasonsAction(
      next.map((r) => r.id),
    );
    setBusy(false);
    if (!res.success) {
      setReasons(prev);
      toast.error(t("rejectionReasonReorderError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("manageRejectionReasons")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <section className="space-y-2 rounded-md border p-3">
            <h3 className="text-sm font-semibold">{t("addRejectionReason")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("rejectionReasonsHint")}
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">{t("rejectionReasonLabel")}</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={t("rejectionReasonPlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !busy && newLabel.trim())
                      onCreate();
                  }}
                />
              </div>
              <ColorPicker
                value={newColor}
                onChange={(v) => setNewColor(v ?? "#EF4444")}
              />
              <Button
                size="sm"
                onClick={onCreate}
                disabled={busy || !newLabel.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("addRejectionReason")}
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("existingRejectionReasons", { count: reasons.length })}
            </h3>
            {reasons.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">
                {t("noRejectionReasons")}
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={reasons.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y rounded-md border">
                    {reasons.map((r) => (
                      <SortableReasonRow
                        key={r.id}
                        reason={r}
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

interface SortableReasonRowProps {
  reason: AdmissionRejectionReason;
  busy: boolean;
  onUpdateColor: (id: string, color: string) => void;
  onRename: (id: string, label: string) => void;
  onArchive: (id: string) => void;
}

function SortableReasonRow({
  reason: r,
  busy,
  onUpdateColor,
  onRename,
  onArchive,
}: SortableReasonRowProps) {
  const t = useTranslations("Admissions");
  const [label, setLabel] = useState(r.label);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: r.id });
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
          aria-label={t("dragRejectionReason")}
          title={t("dragRejectionReason")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <ColorPicker
          size="sm"
          value={r.color}
          onChange={(v) => onUpdateColor(r.id, v ?? "#EF4444")}
          disabled={busy}
        />
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => onRename(r.id, label)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-8 flex-1"
          disabled={busy}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onArchive(r.id)}
          disabled={busy}
          className="h-7 w-7 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
