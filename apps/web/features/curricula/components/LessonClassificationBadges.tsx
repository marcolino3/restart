"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { updateLessonClassificationAction } from "../actions/update-lesson-classification.action";
import {
  LESSON_SCALES,
  LESSON_TYPES,
  type LessonScale,
  type LessonType,
} from "../types";

interface Props {
  nodeId: string;
  lessonType?: LessonType | null;
  lessonScale?: LessonScale | null;
  onChange?: (next: {
    lessonType?: LessonType | null;
    lessonScale?: LessonScale | null;
  }) => void;
}

const TYPE_LABEL: Record<LessonType, string> = {
  P: "P",
  THREE_PL: "3PL",
  E: "E",
  M: "M",
  S: "S",
};

const TYPE_CLS: Record<LessonType, string> = {
  P: "bg-sky-600 text-white",
  THREE_PL: "bg-indigo-600 text-white",
  E: "bg-emerald-600 text-white",
  M: "bg-orange-600 text-white",
  S: "bg-pink-600 text-white",
};

const SCALE_LABEL: Record<LessonScale, string> = {
  MASTERABLE: "M",
  ONGOING: "O",
};

const SCALE_CLS: Record<LessonScale, string> = {
  MASTERABLE: "bg-zinc-700 text-white",
  ONGOING: "bg-zinc-500 text-white",
};

const PILL_BASE =
  "text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded cursor-pointer transition-opacity hover:opacity-80";
const PILL_EMPTY =
  "border border-dashed border-muted-foreground/40 text-muted-foreground/60 bg-transparent";

export function LessonClassificationBadges({
  nodeId,
  lessonType,
  lessonScale,
  onChange,
}: Props) {
  const t = useTranslations("RecordKeeping");
  const [typeOpen, setTypeOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const apply = (input: {
    lessonType?: LessonType | null;
    lessonScale?: LessonScale | null;
  }) => {
    startTransition(async () => {
      const res = await updateLessonClassificationAction({ id: nodeId, ...input });
      if (res.success) {
        onChange?.({
          lessonType: res.data.lessonType,
          lessonScale: res.data.lessonScale,
        });
        toast.success(t("prerequisitesSaved")); // reuse "saved" toast
      } else {
        toast.error(res.error ?? "Save failed");
      }
    });
  };

  return (
    <span className="flex items-center gap-1">
      {/* Type pill */}
      <Popover open={typeOpen} onOpenChange={setTypeOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            className={cn(
              PILL_BASE,
              lessonType ? TYPE_CLS[lessonType] : PILL_EMPTY,
            )}
            title={t("lessonType")}
            onClick={(e) => e.stopPropagation()}
          >
            {lessonType ? TYPE_LABEL[lessonType] : "T?"}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-1"
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-0.5">
            {LESSON_TYPES.map((opt) => {
              const selected = opt === lessonType;
              return (
                <Button
                  key={opt}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-between h-7 px-2 text-xs"
                  onClick={() => {
                    setTypeOpen(false);
                    apply({ lessonType: selected ? null : opt });
                  }}
                >
                  {t(`lessonType${opt}`)}
                  <Check
                    className={cn(
                      "ml-2 h-3.5 w-3.5",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Button>
              );
            })}
            {lessonType && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start h-7 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setTypeOpen(false);
                  apply({ lessonType: null });
                }}
              >
                ✕ {t("noPrerequisites").replace(/\w+ /g, "")}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Scale pill */}
      <Popover open={scaleOpen} onOpenChange={setScaleOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            className={cn(
              PILL_BASE,
              lessonScale ? SCALE_CLS[lessonScale] : PILL_EMPTY,
            )}
            title={t("lessonScale")}
            onClick={(e) => e.stopPropagation()}
          >
            {lessonScale ? SCALE_LABEL[lessonScale] : "S?"}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-1"
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-0.5">
            {LESSON_SCALES.map((opt) => {
              const selected = opt === lessonScale;
              return (
                <Button
                  key={opt}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-between h-7 px-2 text-xs"
                  onClick={() => {
                    setScaleOpen(false);
                    apply({ lessonScale: selected ? null : opt });
                  }}
                >
                  {t(opt)}
                  <Check
                    className={cn(
                      "ml-2 h-3.5 w-3.5",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}
