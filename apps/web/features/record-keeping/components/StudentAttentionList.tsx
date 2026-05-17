"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ChevronDown, ChevronUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

import type { StudentAttentionSummary } from "../actions/get-classroom-attention.action";
import type { AttentionReason } from "../lib/derive-attention-items";

interface Props {
  summaries: StudentAttentionSummary[];
  titleKey?: string;
  subtitleKey?: string;
  initialCount?: number;
}

const REASON_CLS: Record<AttentionReason, string> = {
  NEEDS_MORE_CURRENT: "bg-rose-100 text-rose-800 border-rose-300",
  REPEATED_NEEDS_MORE: "bg-rose-50 text-rose-700 border-rose-200",
  STUCK_PRACTICED: "bg-amber-100 text-amber-800 border-amber-300",
  STUCK_INTRODUCED: "bg-sky-100 text-sky-800 border-sky-300",
  BIG_GAP_INTRO_TO_PRACTICED: "bg-slate-100 text-slate-700 border-slate-300",
};

function StudentAttentionListImpl({
  summaries,
  titleKey = "attentionClassroomTitle",
  subtitleKey = "attentionClassroomSubtitle",
  initialCount = 6,
}: Props) {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? summaries : summaries.slice(0, initialCount);
  const hidden = summaries.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-amber-600" />
          {t(titleKey)}
          <Badge
            variant="secondary"
            className="ml-auto text-[10px] tabular-nums"
          >
            {summaries.length}
          </Badge>
        </CardTitle>
        {subtitleKey && (
          <p className="text-xs text-muted-foreground">{t(subtitleKey)}</p>
        )}
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("attentionNoData")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((s) => (
              <li
                key={s.studentId}
                className="flex flex-col gap-2 rounded-md border bg-card px-3 py-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertTriangle
                    aria-hidden="true"
                    className={cn(
                      "h-3.5 w-3.5",
                      s.byReason.NEEDS_MORE_CURRENT > 0
                        ? "text-rose-600"
                        : "text-amber-600",
                    )}
                  />
                  <Link
                    href={`${ROUTES.admin.studentsView(locale, s.studentId)}?tab=progress`}
                    className="text-sm font-medium hover:underline flex-1 min-w-0 truncate"
                  >
                    {s.lastName} {s.firstName}
                  </Link>
                  <Badge
                    variant="outline"
                    className="text-[10px] tabular-nums whitespace-nowrap"
                  >
                    {t("attentionSignalsCount", { count: s.totalSignals })}
                  </Badge>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {s.topItems.map((item) => (
                    <li key={`${item.lessonId}-${item.reason}`}>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase",
                          REASON_CLS[item.reason],
                        )}
                        title={item.lessonName}
                      >
                        {item.lessonName.length > 28
                          ? `${item.lessonName.slice(0, 26)}…`
                          : item.lessonName}
                      </Badge>
                    </li>
                  ))}
                  {s.totalSignals > s.topItems.length && (
                    <li>
                      <Badge
                        variant="secondary"
                        className="text-[10px] tabular-nums"
                      >
                        +{s.totalSignals - s.topItems.length}
                      </Badge>
                    </li>
                  )}
                </ul>
              </li>
            ))}
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
        {expanded && summaries.length > initialCount && (
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

/** Memoized: parent re-renders (Tabs switching) don't re-render this
 *  potentially long list unless the data props change. */
export const StudentAttentionList = memo(StudentAttentionListImpl);
