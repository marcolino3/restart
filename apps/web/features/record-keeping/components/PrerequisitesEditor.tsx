"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { getLessonPrerequisitesAction } from "../actions/get-lesson-prerequisites.action";
import { setLessonPrerequisitesAction } from "../actions/set-lesson-prerequisites.action";
import type { LessonOption } from "../types";

interface Props {
  lessonId: string;
  /** All LESSON-nodes of the org (already loaded by parent). */
  allLessons: LessonOption[];
  /** Optional label/trigger override. */
  triggerLabel?: string;
}

const pickName = (lesson: LessonOption, locale: string): string => {
  const normalized = locale.toUpperCase();
  return (
    lesson.translations.find((t) => t.locale === normalized)?.name ??
    lesson.translations[0]?.name ??
    lesson.id
  );
};

export const PrerequisitesEditor = ({
  lessonId,
  allLessons,
  triggerLabel,
}: Props) => {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getLessonPrerequisitesAction(lessonId)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setSelectedIds(res.data.map((l) => l.id));
        } else {
          toast.error(res.error ?? t("prerequisitesSaveError"));
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, lessonId, t]);

  // Sich-selbst-nicht-anbieten
  const candidates = useMemo(
    () => allLessons.filter((l) => l.id !== lessonId),
    [allLessons, lessonId],
  );

  const selectedLessons = useMemo(
    () => candidates.filter((l) => selectedIds.includes(l.id)),
    [candidates, selectedIds],
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSave = () => {
    startTransition(async () => {
      const res = await setLessonPrerequisitesAction({
        lessonId,
        prerequisiteIds: selectedIds,
      });
      if (res.success) {
        toast.success(t("prerequisitesSaved"));
        setOpen(false);
      } else {
        const isCycle =
          typeof res.error === "string" && /cycle/i.test(res.error);
        toast.error(
          isCycle ? t("cycleDetected") : t("prerequisitesSaveError"),
          { description: !isCycle ? res.error : undefined },
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {triggerLabel ?? t("prerequisitesEditor")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("prerequisitesEditor")}</DialogTitle>
          <DialogDescription>{t("prerequisitesDescription")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedLessons.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedLessons.map((l) => (
                  <Badge
                    key={l.id}
                    variant="default"
                    className="flex items-center gap-1 px-2 py-0.5 text-xs"
                  >
                    {pickName(l, locale)}
                    <button
                      type="button"
                      className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      onClick={() => toggle(l.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("noPrerequisites")}
              </p>
            )}

            <Command className="rounded-md border">
              <CommandInput placeholder={t("searchLessons")} className="h-9" />
              <CommandList className="max-h-72">
                <CommandEmpty>{t("noLessonsFound")}</CommandEmpty>
                <CommandGroup>
                  {candidates.map((l) => {
                    const isSelected = selectedIds.includes(l.id);
                    const name = pickName(l, locale);
                    return (
                      <CommandItem
                        key={l.id}
                        value={name}
                        onSelect={() => toggle(l.id)}
                      >
                        {name}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={isPending || loading}>
            {t("savePrerequisites")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
