"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  archiveAdmissionStageAction,
  createAdmissionStageAction,
  reorderAdmissionStagesAction,
  updateAdmissionStageAction,
} from "../actions/stage-actions";
import type { KanbanStage } from "../types";

type StageType =
  | "INITIAL"
  | "IN_PROGRESS"
  | "ACCEPTED"
  | "ENROLLED"
  | "REJECTED";

interface Props {
  stages: KanbanStage[];
  onClose: () => void;
}

export function ManageStagesDialog({ stages: initialStages, onClose }: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [stages, setStages] = useState<KanbanStage[]>(initialStages);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#0EA5E9");
  const [newType, setNewType] = useState<StageType>("IN_PROGRESS");
  const [busy, setBusy] = useState(false);

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

  const onMove = async (id: string, direction: -1 | 1) => {
    const idx = stages.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= stages.length) return;
    const next = [...stages];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setStages(next);
    setBusy(true);
    const res = await reorderAdmissionStagesAction(next.map((s) => s.id));
    setBusy(false);
    if (!res.success) {
      setStages(stages); // rollback
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
              <div className="divide-y rounded-md border">
                {stages.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <ColorPicker
                      size="sm"
                      value={s.color}
                      onChange={(v) => onUpdateColor(s.id, v ?? "#94A3B8")}
                      disabled={busy}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {s.slug}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {stageTypeOptions.find((o) => o.value === s.stageType)
                        ?.label ?? s.stageType}
                    </Badge>
                    {s.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t("stageDefault")}
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onMove(s.id, -1)}
                      disabled={busy || idx === 0}
                      className="h-7 w-7"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onMove(s.id, 1)}
                      disabled={busy || idx === stages.length - 1}
                      className="h-7 w-7"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
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
                ))}
              </div>
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
