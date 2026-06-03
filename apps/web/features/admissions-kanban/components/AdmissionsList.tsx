"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  BellRing,
  Globe,
  PartyPopper,
  UserPlus2,
  Users2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { cn } from "@/lib/utils";

import {
  resolveTableColumns,
  TABLE_COLUMN_LABEL,
  type TableColumnKey,
} from "../field-registry";
import type { KanbanApplication, KanbanStage } from "../types";

interface Props {
  stages: KanbanStage[];
  /** Org-global column selection; `null` ⇒ default set. */
  tableColumns: string[] | null;
  applications: KanbanApplication[];
  onOpenCard: (id: string) => void;
}

/** `"child"` is the fixed leading column; the rest are configurable. */
type SortKey = "child" | TableColumnKey;
type SortDir = "asc" | "desc";

const SOURCE_ICON: Record<
  KanbanApplication["source"],
  React.ComponentType<{ className?: string }> | null
> = {
  PUBLIC_FORM: Globe,
  OPEN_DAY: PartyPopper,
  REFERRAL: UserPlus2,
  MANUAL: null,
  OTHER: null,
};

const GENDER_GLYPH: Record<NonNullable<KanbanApplication["childGender"]>, string> =
  {
    MALE: "♂",
    FEMALE: "♀",
    OTHER: "⚧",
  };

export function AdmissionsList({
  stages,
  tableColumns,
  applications,
  onOpenCard,
}: Props) {
  const t = useTranslations("Admissions");
  const columns = resolveTableColumns(tableColumns);
  const [sortKey, setSortKey] = useState<SortKey>("child");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );
  const stagePosById = useMemo(
    () => new Map(stages.map((s, i) => [s.id, i])),
    [stages],
  );

  // Now is computed once per render (client-only since AdmissionsKanban already
  // gates rendering behind `mounted`).
  const now = Date.now();
  const daysInStageFor = (a: KanbanApplication): number => {
    const diff = now - new Date(a.stageEnteredAt).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // A comparable sort value for any column. Numbers sort numerically, strings
  // via localeCompare (handled in the sorter below).
  const sortValue = (key: SortKey, a: KanbanApplication): string | number => {
    switch (key) {
      case "child":
        return `${a.childLastName} ${a.childFirstName}`;
      case "stage":
        return stagePosById.get(a.admissionStageId) ?? 999;
      case "gradeLevel":
        return a.desiredGradeLevelName ?? "ZZZ";
      case "family":
        return a.family.name ?? "";
      case "gender":
        return a.childGender ?? "ZZZ";
      case "source":
        return a.source;
      case "status":
        return a.status;
      case "days":
        return daysInStageFor(a);
      case "contact":
        return a.family.contactNames[0] ?? "ZZZ";
      case "reminders":
        return a.openRemindersCount;
      default:
        return "";
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const arr = [...applications];
    arr.sort((a, b) => {
      const va = sortValue(sortKey, a);
      const vb = sortValue(sortKey, b);
      if (typeof va === "number" && typeof vb === "number") {
        return dir * (va - vb);
      }
      return dir * String(va).localeCompare(String(vb));
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications, sortKey, sortDir, stagePosById]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    !active ? (
      <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
    ) : dir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );

  const numericCols = new Set<TableColumnKey>(["days", "reminders"]);

  const renderCell = (key: TableColumnKey, a: KanbanApplication) => {
    switch (key) {
      case "stage": {
        const stage = stageById.get(a.admissionStageId);
        return (
          <TableCell key={key}>
            {stage && (
              <Badge
                variant="outline"
                style={
                  stage.color
                    ? { borderColor: stage.color, color: stage.color }
                    : undefined
                }
              >
                {stage.name}
              </Badge>
            )}
          </TableCell>
        );
      }
      case "gradeLevel":
        return (
          <TableCell key={key} className="text-sm">
            {a.desiredGradeLevelName ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-border"
                  style={{
                    backgroundColor:
                      a.desiredGradeLevelColor ?? "var(--muted)",
                  }}
                />
                <span className="truncate">{a.desiredGradeLevelName}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
        );
      case "family":
        return (
          <TableCell key={key} className="text-sm">
            <div className="flex items-center gap-1.5">
              <span className="truncate">{a.family.name ?? "—"}</span>
              {a.family.childrenCount > 1 && (
                <Badge variant="secondary" className="gap-0.5 text-[10px]">
                  <Users2 className="h-2.5 w-2.5" />
                  {a.family.childrenCount}
                </Badge>
              )}
            </div>
          </TableCell>
        );
      case "gender":
        return (
          <TableCell key={key} className="text-sm">
            {a.childGender ? (
              <span title={t("fieldGender")}>
                {GENDER_GLYPH[a.childGender]}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
        );
      case "source": {
        const Icon = SOURCE_ICON[a.source];
        return (
          <TableCell key={key}>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {sourceLabel(a.source, t)}
            </span>
          </TableCell>
        );
      }
      case "status":
        return (
          <TableCell key={key} className="text-sm">
            <Badge variant="outline">{t(statusKey(a.status))}</Badge>
          </TableCell>
        );
      case "days": {
        const days = daysInStageFor(a);
        return (
          <TableCell key={key} className="text-right">
            <Badge
              variant={days > 14 ? "destructive" : "outline"}
              className="text-[10px]"
            >
              {days}d
            </Badge>
          </TableCell>
        );
      }
      case "contact":
        return (
          <TableCell key={key} className="text-sm">
            <span className="truncate">
              {a.family.contactNames[0] ?? "—"}
            </span>
          </TableCell>
        );
      case "reminders":
        return (
          <TableCell key={key} className="text-right">
            {a.openRemindersCount > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded px-1 text-xs font-medium",
                  a.overdueRemindersCount > 0
                    ? "text-destructive"
                    : "text-amber-700",
                )}
              >
                {a.overdueRemindersCount > 0 ? (
                  <BellRing className="h-3.5 w-3.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                {a.openRemindersCount}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
        );
      default:
        return <TableCell key={key} />;
    }
  };

  const colCount = columns.length + 1;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <ColHead
              label={t("listColChild")}
              onClick={() => toggle("child")}
              active={sortKey === "child"}
              dir={sortDir}
              IconC={SortIcon}
            />
            {columns.map((key) => (
              <ColHead
                key={key}
                label={t(TABLE_COLUMN_LABEL[key])}
                onClick={() => toggle(key)}
                active={sortKey === key}
                dir={sortDir}
                IconC={SortIcon}
                numeric={numericCols.has(key)}
              />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="py-8 text-center text-xs italic text-muted-foreground"
              >
                {t("listEmpty")}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((a) => {
              const birthYear = a.childDateOfBirth?.slice(0, 4);
              return (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => onOpenCard(a.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <StudentAvatar
                        studentId={a.id}
                        firstName={a.childFirstName}
                        lastName={a.childLastName}
                        className="h-7 w-7 shrink-0"
                        fallbackClassName="text-[10px]"
                      />
                      <div className="min-w-0">
                        <div className="truncate">
                          {a.childFirstName} {a.childLastName}
                        </div>
                        {birthYear && (
                          <div className="text-[10px] text-muted-foreground">
                            Jg. {birthYear}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {columns.map((key) => renderCell(key, a))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ColHead({
  label,
  onClick,
  active,
  dir,
  IconC,
  numeric,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
  IconC: React.ComponentType<{ active: boolean; dir: SortDir }>;
  numeric?: boolean;
}) {
  return (
    <TableHead className={cn(numeric && "text-right")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <IconC active={active} dir={dir} />
      </button>
    </TableHead>
  );
}

function statusKey(status: KanbanApplication["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "statusActive";
    case "REJECTED":
      return "statusRejected";
    case "ENROLLED":
      return "statusEnrolled";
    case "ARCHIVED":
    default:
      return "statusArchived";
  }
}

function sourceLabel(
  source: KanbanApplication["source"],
  t: (key: string) => string,
): string {
  switch (source) {
    case "PUBLIC_FORM":
      return t("sourcePublicForm");
    case "OPEN_DAY":
      return t("sourceOpenDay");
    case "REFERRAL":
      return t("sourceReferral");
    case "OTHER":
      return t("sourceOther");
    case "MANUAL":
      return t("sourceManual");
    default:
      return source;
  }
}
