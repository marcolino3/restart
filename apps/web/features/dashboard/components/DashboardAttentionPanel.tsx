import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import type { StudentAttentionSummary } from "@/features/record-keeping/actions/get-classroom-attention.action";
import type { AttentionReason } from "@/features/record-keeping/lib/derive-attention-items";

const REASON_VARIANT: Record<
  AttentionReason,
  "rose" | "amber" | "sky" | "slate"
> = {
  NEEDS_MORE_CURRENT: "rose",
  REPEATED_NEEDS_MORE: "rose",
  LOW_CONFIDENCE: "rose",
  CONFIDENCE_DROP: "rose",
  GIVES_UP_PATTERN: "rose",
  STUCK_PRACTICED: "amber",
  MATERIAL_TOO_HARD: "amber",
  STUCK_INTRODUCED: "sky",
  BIG_GAP_INTRO_TO_PRACTICED: "slate",
};

/** Localized "Area › Topic" path from a lesson's ancestor chain. */
function ancestorPath(
  ancestors: StudentAttentionSummary["topItems"][number]["ancestors"],
  locale: string
) {
  return ancestors
    .map(
      (a) =>
        a.translations.find((tr) => tr.locale === locale)?.name ??
        a.translations[0]?.name
    )
    .filter(Boolean)
    .join(" › ");
}

interface Props {
  summaries: StudentAttentionSummary[];
  maxRows?: number;
}

/**
 * Dashboard panel "Braucht Aufmerksamkeit" (design handoff): students with
 * conspicuous learning patterns, one row per student with the top signal.
 */
export async function DashboardAttentionPanel({
  summaries,
  maxRows = 4,
}: Props) {
  const t = await getTranslations("Dashboard");
  const tReason = await getTranslations("RecordKeeping");
  const locale = await getLocale();

  const rows = summaries.slice(0, maxRows);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("attentionTitle")}
          <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent-foreground tabular-nums">
            {summaries.length}
          </span>
        </CardTitle>
        <p className="text-[12.5px] text-muted-foreground">
          {t("attentionHint")}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("attentionEmpty")}
          </p>
        ) : (
          rows.map((s) => {
            const top = s.topItems[0];
            return (
              <Link
                key={s.studentId}
                href={`${ROUTES.admin.studentsView(locale, s.studentId)}?tab=progress`}
                className="flex items-center gap-3 rounded-[calc(var(--radius-card)-5px)] border bg-row-hover px-[13px] py-2.5 transition-colors hover:bg-muted"
              >
                <StudentAvatar
                  studentId={s.studentId}
                  firstName={s.firstName}
                  lastName={s.lastName}
                  className="size-[30px]"
                  fallbackClassName="text-[10.5px]"
                />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13.5px] font-semibold">
                    {s.firstName} {s.lastName}
                    {top ? ` — ${top.lessonName}` : ""}
                  </b>
                  {top && (
                    <small className="block truncate text-[11.5px] text-muted-foreground">
                      {ancestorPath(top.ancestors, locale)}
                    </small>
                  )}
                </span>
                {top && (
                  <Badge variant={REASON_VARIANT[top.reason]}>
                    {tReason(`attentionTitle_${top.reason}`)}
                    {top.days != null &&
                      ` · ${t("attentionDaysShort", { count: top.days })}`}
                  </Badge>
                )}
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
