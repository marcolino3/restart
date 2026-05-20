"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { AttentionItem, AttentionReason } from "../lib/derive-attention-items";
import { LessonBreadcrumb } from "./LessonBreadcrumb";

interface Props {
  items: AttentionItem[];
  /** Hard cap before "show more" toggle. */
  initialCount?: number;
  /** Override card title. Default: i18n key `attentionTitle`. */
  titleKey?: string;
  subtitleKey?: string;
}

const REASON_CLS: Record<AttentionReason, string> = {
  NEEDS_MORE_CURRENT: "bg-rose-100 text-rose-800 border-rose-300",
  REPEATED_NEEDS_MORE: "bg-rose-50 text-rose-700 border-rose-200",
  STUCK_PRACTICED: "bg-amber-100 text-amber-800 border-amber-300",
  STUCK_INTRODUCED: "bg-sky-100 text-sky-800 border-sky-300",
  BIG_GAP_INTRO_TO_PRACTICED: "bg-slate-100 text-slate-700 border-slate-300",
  LOW_CONFIDENCE: "bg-rose-100 text-rose-800 border-rose-300",
  GIVES_UP_PATTERN: "bg-rose-50 text-rose-700 border-rose-200",
  MATERIAL_TOO_HARD: "bg-amber-100 text-amber-800 border-amber-300",
  CONFIDENCE_DROP: "bg-rose-100 text-rose-800 border-rose-300",
};

function AttentionListImpl({
  items,
  initialCount = 8,
  titleKey = "attentionTitle",
  subtitleKey = "attentionSubtitle",
}: Props) {
  const t = useTranslations("RecordKeeping");
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? items : items.slice(0, initialCount);
  const hidden = items.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {t(titleKey)}
          <Badge variant="secondary" className="ml-auto text-[10px] tabular-nums">
            {items.length}
          </Badge>
        </CardTitle>
        {subtitleKey && (
          <p className="text-xs text-muted-foreground">{t(subtitleKey)}</p>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("attentionEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((item) => {
              const reasonText = renderReason(t, item);
              const titleText = item.lessonName || t(`attentionTitle_${item.reason}` as const);
              return (
                <li
                  key={`${item.lessonId}-${item.reason}`}
                  className="flex flex-col gap-1 rounded-md border bg-card px-3 py-2"
                >
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">
                      {titleText}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase whitespace-nowrap",
                        REASON_CLS[item.reason],
                      )}
                    >
                      {reasonText}
                    </Badge>
                  </div>
                  {item.ancestors.length > 0 && (
                    <LessonBreadcrumb ancestors={item.ancestors} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {hidden > 0 && !expanded && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="mr-1 h-4 w-4" />
            {t("attentionShowMore", { count: hidden })}
          </Button>
        )}
        {expanded && items.length > initialCount && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="mr-1 h-4 w-4" />
            {t("attentionCollapse")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** Memoized: parent re-renders don't re-render the list unless items change. */
export const AttentionList = memo(AttentionListImpl);

function renderReason(
  t: ReturnType<typeof useTranslations>,
  item: AttentionItem,
): string {
  switch (item.reason) {
    case "NEEDS_MORE_CURRENT":
      return t("attentionReasonNeedsMoreCurrent", { days: item.days ?? 0 });
    case "REPEATED_NEEDS_MORE":
      return t("attentionReasonRepeatedNeedsMore", { count: item.days ?? 0 });
    case "STUCK_PRACTICED":
      return t("attentionReasonStuckPracticed", { days: item.days ?? 0 });
    case "STUCK_INTRODUCED":
      return t("attentionReasonStuckIntroduced", { days: item.days ?? 0 });
    case "BIG_GAP_INTRO_TO_PRACTICED":
      return t("attentionReasonBigGap", { days: item.days ?? 0 });
    case "LOW_CONFIDENCE":
      return t("attentionReasonLowConfidence", { pct: item.days ?? 0 });
    case "GIVES_UP_PATTERN":
      return t("attentionReasonGivesUp", { pct: item.days ?? 0 });
    case "MATERIAL_TOO_HARD":
      return t("attentionReasonMaterialTooHard", { pct: item.days ?? 0 });
    case "CONFIDENCE_DROP":
      return t("attentionReasonConfidenceDrop");
  }
}
