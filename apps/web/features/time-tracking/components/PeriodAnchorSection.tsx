"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setPeriodAnchorAction } from "../actions/periods.action";

interface Props {
  /** Current anchor as MM-DD. */
  anchor: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Days available for a month, ignoring leap years (29 Feb is not selectable). */
const daysInMonth = (month: number) =>
  new Date(2001, month, 0).getDate();

export const PeriodAnchorSection = ({ anchor }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [month, setMonth] = useState(() => anchor.split("-")[0] ?? "01");
  const [day, setDay] = useState(() => anchor.split("-")[1] ?? "01");

  const monthOptions = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => ({
      value: pad(i + 1),
      label: fmt.format(new Date(2001, i, 1)),
    }));
  }, [locale]);

  const dayOptions = useMemo(() => {
    const max = daysInMonth(parseInt(month, 10));
    return Array.from({ length: max }, (_, i) => pad(i + 1));
  }, [month]);

  const onMonthChange = (value: string) => {
    setMonth(value);
    const max = daysInMonth(parseInt(value, 10));
    if (parseInt(day, 10) > max) setDay(pad(max));
  };

  const current = `${month}-${day}`;
  const dirty = current !== anchor;

  const save = () =>
    startTransition(async () => {
      const r = await setPeriodAnchorAction(current);
      if (r.success) {
        toast.success(tc("success"));
        router.refresh();
      } else {
        toast.error(tc("error"));
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("periodAnchor")}</CardTitle>
        <CardDescription>{t("periodAnchorDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="period-anchor-day">{t("periodAnchorDay")}</Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger id="period-anchor-day" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="period-anchor-month">{t("periodAnchorMonth")}</Label>
          <Select value={month} onValueChange={onMonthChange}>
            <SelectTrigger id="period-anchor-month" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={save} disabled={isPending || !dirty}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {tc("save")}
        </Button>
      </CardContent>
    </Card>
  );
};
