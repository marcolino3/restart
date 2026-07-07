"use client";

import { useEffect, useState } from "react";
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
  archiveAdmissionAppointmentTypeAction,
  createAdmissionAppointmentTypeAction,
  getAdmissionAppointmentTypesAction,
  reorderAdmissionAppointmentTypesAction,
  updateAdmissionAppointmentTypeAction,
} from "../actions/appointment-types-actions";
import type { AdmissionAppointmentType } from "../types";

const DEFAULT_COLOR = "#0EA5E9";

interface Props {
  types: AdmissionAppointmentType[];
  onClose: () => void;
}

export function ManageAppointmentTypesDialog({
  types: initialTypes,
  onClose,
}: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [types, setTypes] =
    useState<AdmissionAppointmentType[]>(initialTypes);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [busy, setBusy] = useState(false);

  // Load the types directly on mount (the Kanban toolbar passes an empty list).
  useEffect(() => {
    let active = true;
    getAdmissionAppointmentTypesAction()
      .then((data) => {
        if (active) setTypes(data);
      })
      .catch((error) => {
        console.error(error);
      });
    return () => {
      active = false;
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onCreate = async () => {
    const label = newLabel.trim();
    if (!label) {
      toast.error(t("appointmentTypePlaceholder"));
      return;
    }
    setBusy(true);
    const maxPos = types.reduce((m, r) => Math.max(m, r.position), -1);
    const res = await createAdmissionAppointmentTypeAction({
      label,
      color: newColor,
      position: maxPos + 1,
    });
    setBusy(false);
    if (res.success) {
      setTypes((prev) => [...prev, res.data]);
      setNewLabel("");
      toast.success(t("appointmentTypeCreated"));
      router.refresh();
    } else {
      toast.error(t("appointmentTypeCreateError"), { description: res.error });
    }
  };

  const onArchive = async (id: string) => {
    if (!window.confirm(t("appointmentTypeArchiveConfirm"))) return;
    setBusy(true);
    const res = await archiveAdmissionAppointmentTypeAction(id);
    setBusy(false);
    if (res.success) {
      setTypes((prev) => prev.filter((r) => r.id !== id));
      toast.success(t("appointmentTypeArchived"));
      router.refresh();
    } else {
      toast.error(t("appointmentTypeUpdateError"), { description: res.error });
    }
  };

  const onUpdateColor = async (id: string, color: string) => {
    const original = types.find((r) => r.id === id);
    if (!original || original.color === color) return;
    setTypes((prev) => prev.map((r) => (r.id === id ? { ...r, color } : r)));
    const res = await updateAdmissionAppointmentTypeAction({ id, color });
    if (!res.success) {
      setTypes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, color: original.color } : r)),
      );
      toast.error(t("appointmentTypeUpdateError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const onRename = async (id: string, label: string) => {
    const original = types.find((r) => r.id === id);
    const trimmed = label.trim();
    if (!original || !trimmed || original.label === trimmed) return;
    const res = await updateAdmissionAppointmentTypeAction({
      id,
      label: trimmed,
    });
    if (!res.success) {
      setTypes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, label: original.label } : r)),
      );
      toast.error(t("appointmentTypeUpdateError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const fromIdx = types.findIndex((r) => r.id === active.id);
    const toIdx = types.findIndex((r) => r.id === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...types];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const prev = types;
    setTypes(next);
    setBusy(true);
    const res = await reorderAdmissionAppointmentTypesAction(
      next.map((r) => r.id),
    );
    setBusy(false);
    if (!res.success) {
      setTypes(prev);
      toast.error(t("appointmentTypeReorderError"), { description: res.error });
    } else {
      router.refresh();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("manageAppointmentTypes")}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <section className="space-y-2 rounded-md border p-3">
            <h3 className="text-sm font-semibold">{t("addAppointmentType")}</h3>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-[7px]">
                <Label className="text-[12.5px] font-semibold">
                  {t("appointmentTypeLabel")}
                </Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={t("appointmentTypePlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !busy && newLabel.trim())
                      onCreate();
                  }}
                />
              </div>
              <ColorPicker
                value={newColor}
                onChange={(v) => setNewColor(v ?? DEFAULT_COLOR)}
              />
              <Button
                size="sm"
                onClick={onCreate}
                disabled={busy || !newLabel.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("addAppointmentType")}
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("existingAppointmentTypes", { count: types.length })}
            </h3>
            {types.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">
                {t("noAppointmentTypes")}
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={types.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y rounded-md border">
                    {types.map((r) => (
                      <SortableTypeRow
                        key={r.id}
                        type={r}
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

interface SortableTypeRowProps {
  type: AdmissionAppointmentType;
  busy: boolean;
  onUpdateColor: (id: string, color: string) => void;
  onRename: (id: string, label: string) => void;
  onArchive: (id: string) => void;
}

function SortableTypeRow({
  type: r,
  busy,
  onUpdateColor,
  onRename,
  onArchive,
}: SortableTypeRowProps) {
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
          aria-label={t("dragAppointmentType")}
          title={t("dragAppointmentType")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <ColorPicker
          size="sm"
          value={r.color}
          onChange={(v) => onUpdateColor(r.id, v ?? DEFAULT_COLOR)}
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
