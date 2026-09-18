import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyShiftAssignmentsAction } from "../../actions/shift-plans.action";
import { ShiftChip } from "../ShiftsSection";
import { formatPlanDate } from "../../lib/shift-plan-dates";
import { toISODate } from "../../lib/to-iso-date";

const DAYS_AHEAD = 28;

/** Own published shift assignments for the coming weeks (server component). */
export const MyShiftsSection = async () => {
  const t = await getTranslations("TimeTracking");
  const locale = await getLocale();
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + DAYS_AHEAD);
  const res = await getMyShiftAssignmentsAction(toISODate(from), toISODate(to));
  const rows = res.success ? res.data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("myShifts")}</CardTitle>
        <CardDescription>{t("myShiftsHelp")}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("myShiftsNone")}</p>
        ) : (
          <ul className="divide-y">
            {rows.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium">{formatPlanDate(a.date, locale)}</span>
                <span className="flex items-center gap-2">
                  {a.shift ? <ShiftChip shift={a.shift} /> : null}
                  {a.shift ? (
                    <span className="text-xs text-muted-foreground">
                      {a.shift.startTime} – {a.shift.endTime}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
