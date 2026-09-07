"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { handleAction } from "@/lib/actions/handle-action";
import {
  setTeamShiftsAction,
  type Shift,
} from "@/features/time-tracking/actions/shifts.action";
import { ShiftChip } from "@/features/time-tracking/components/ShiftsSection";

interface Props {
  teamId: string;
  /** All shifts of the org. */
  shifts: Shift[];
  /** Ids of the shifts this team currently works. */
  initialShiftIds: string[];
  /** SHIFT_MANAGE — without it the card is read-only. */
  canManage: boolean;
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Which org-wide shifts this team works. Checkbox list with an explicit save —
 * the set is replaced as a whole (setTeamShifts), so partial toggles never hit
 * the server one by one.
 */
export function TeamShiftsCard({
  teamId,
  shifts,
  initialShiftIds,
  canManage,
}: Props) {
  const t = useTranslations("Teams");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [selected, setSelected] = React.useState<string[]>(initialShiftIds);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setSelected(initialShiftIds), [initialShiftIds]);

  const dirty = !sameSet(selected, initialShiftIds);

  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((s) => s !== id),
    );

  const onSave = async () => {
    setSaving(true);
    await handleAction({
      action: () => setTeamShiftsAction({ teamId, shiftIds: selected }),
      successMessage: t("teamShiftsSaved"),
      errorMessage: t("teamShiftsSaveError"),
      onSuccess: () => router.refresh(),
    });
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            {t("shifts")}
          </CardTitle>
          <CardDescription>{t("shiftsDescription")}</CardDescription>
        </div>
        {canManage ? (
          <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
            {tCommon("save")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("noShiftsAvailable")}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-ctl border">
            {shifts.map((shift) => {
              const checked = selected.includes(shift.id);
              const id = `team-shift-${shift.id}`;
              return (
                <li key={shift.id} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    disabled={!canManage}
                    onCheckedChange={(v) => toggle(shift.id, v === true)}
                  />
                  <label
                    htmlFor={id}
                    className="flex flex-1 cursor-pointer items-center justify-between gap-3 text-sm"
                  >
                    <ShiftChip shift={shift} />
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {shift.startTime}–{shift.endTime}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
