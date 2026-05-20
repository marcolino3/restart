"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ArrowUpDown, Globe, PartyPopper, UserPlus2, Users2 } from "lucide-react";

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

import type { KanbanApplication, KanbanStage } from "../types";

interface Props {
  stages: KanbanStage[];
  applications: KanbanApplication[];
  onOpenCard: (id: string) => void;
}

type SortKey = "child" | "stage" | "gradeLevel" | "family" | "days" | "source";
type SortDir = "asc" | "desc";

const SOURCE_ICON: Record<KanbanApplication["source"], React.ComponentType<{ className?: string }> | null> = {
  PUBLIC_FORM: Globe,
  OPEN_DAY: PartyPopper,
  REFERRAL: UserPlus2,
  MANUAL: null,
  OTHER: null,
};

export function AdmissionsList({ stages, applications, onOpenCard }: Props) {
  const t = useTranslations("Admissions");
  const [sortKey, setSortKey] = useState<SortKey>("stage");
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

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const arr = [...applications];
    arr.sort((a, b) => {
      switch (sortKey) {
        case "child":
          return (
            dir *
            `${a.childLastName} ${a.childFirstName}`.localeCompare(
              `${b.childLastName} ${b.childFirstName}`,
            )
          );
        case "stage":
          return (
            dir *
            ((stagePosById.get(a.admissionStageId) ?? 999) -
              (stagePosById.get(b.admissionStageId) ?? 999))
          );
        case "gradeLevel":
          return (
            dir *
            (a.desiredGradeLevelName ?? "ZZZ").localeCompare(
              b.desiredGradeLevelName ?? "ZZZ",
            )
          );
        case "family":
          return (
            dir *
            (a.family.name ?? "").localeCompare(b.family.name ?? "")
          );
        case "days":
          return dir * (daysInStageFor(a) - daysInStageFor(b));
        case "source":
          return dir * a.source.localeCompare(b.source);
        default:
          return 0;
      }
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
            <ColHead
              label={t("listColStage")}
              onClick={() => toggle("stage")}
              active={sortKey === "stage"}
              dir={sortDir}
              IconC={SortIcon}
            />
            <ColHead
              label={t("listColGrade")}
              onClick={() => toggle("gradeLevel")}
              active={sortKey === "gradeLevel"}
              dir={sortDir}
              IconC={SortIcon}
            />
            <ColHead
              label={t("listColFamily")}
              onClick={() => toggle("family")}
              active={sortKey === "family"}
              dir={sortDir}
              IconC={SortIcon}
            />
            <ColHead
              label={t("listColDays")}
              onClick={() => toggle("days")}
              active={sortKey === "days"}
              dir={sortDir}
              IconC={SortIcon}
              numeric
            />
            <ColHead
              label={t("listColSource")}
              onClick={() => toggle("source")}
              active={sortKey === "source"}
              dir={sortDir}
              IconC={SortIcon}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-xs italic text-muted-foreground"
              >
                {t("listEmpty")}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((a) => {
              const stage = stageById.get(a.admissionStageId);
              const days = daysInStageFor(a);
              const Icon = SOURCE_ICON[a.source];
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
                  <TableCell>
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
                  <TableCell className="text-sm">
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
                        <span className="truncate">
                          {a.desiredGradeLevelName}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
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
                  <TableCell className="text-right">
                    <Badge
                      variant={days > 14 ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {days}d
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {Icon ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                        {sourceLabel(a.source, t)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {sourceLabel(a.source, t)}
                      </span>
                    )}
                  </TableCell>
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
