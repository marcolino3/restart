"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

import type { AdmissionRejectedBy, RejectedApplication } from "../types";

interface Props {
  applications: RejectedApplication[];
}

type SortKey = "child" | "family" | "grade" | "reason" | "by" | "date";
type SortDir = "asc" | "desc";

const rejectedByKey = (by: AdmissionRejectedBy): string => {
  switch (by) {
    case "SCHOOL":
      return "rejectedBySchool";
    case "PARENTS":
      return "rejectedByParents";
    case "OTHER":
    default:
      return "rejectedByOther";
  }
};

export function RejectedApplicationsList({ applications }: Props) {
  const t = useTranslations("Admissions");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const dateFmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? applications.filter((a) =>
          [
            `${a.childFirstName} ${a.childLastName}`,
            a.familyName ?? "",
            a.rejectionReasonLabel ?? a.rejectionReason ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : applications;
    const dir = sortDir === "asc" ? 1 : -1;
    const value = (a: RejectedApplication): string | number => {
      switch (sortKey) {
        case "child":
          return `${a.childLastName} ${a.childFirstName}`.toLowerCase();
        case "family":
          return (a.familyName ?? "").toLowerCase();
        case "grade":
          return (a.desiredGradeLevelName ?? "").toLowerCase();
        case "reason":
          return (
            a.rejectionReasonLabel ??
            a.rejectionReason ??
            ""
          ).toLowerCase();
        case "by":
          return a.rejectedBy ?? "";
        case "date":
          return new Date(a.rejectedAt).getTime() || 0;
        default:
          return "";
      }
    };
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (typeof va === "number" && typeof vb === "number")
        return dir * (va - vb);
      return dir * String(va).localeCompare(String(vb));
    });
  }, [applications, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (applications.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("rejectedListEmpty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("rejectedSearchPlaceholder")}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <ColHead
                label={t("listColChild")}
                sortKey="child"
                active={sortKey === "child"}
                dir={sortDir}
                onClick={toggleSort}
              />
              <ColHead
                label={t("fieldFamilyName")}
                sortKey="family"
                active={sortKey === "family"}
                dir={sortDir}
                onClick={toggleSort}
              />
              <ColHead
                label={t("fieldGradeLevel")}
                sortKey="grade"
                active={sortKey === "grade"}
                dir={sortDir}
                onClick={toggleSort}
              />
              <ColHead
                label={t("rejectionReason")}
                sortKey="reason"
                active={sortKey === "reason"}
                dir={sortDir}
                onClick={toggleSort}
              />
              <ColHead
                label={t("rejectedByLabel")}
                sortKey="by"
                active={sortKey === "by"}
                dir={sortDir}
                onClick={toggleSort}
              />
              <ColHead
                label={t("rejectedAtLabel")}
                sortKey="date"
                active={sortKey === "date"}
                dir={sortDir}
                onClick={toggleSort}
                align="right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow
                key={a.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/admissions/${a.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StudentAvatar
                      studentId={a.id}
                      firstName={a.childFirstName}
                      lastName={a.childLastName}
                      className="h-7 w-7 shrink-0"
                      fallbackClassName="text-[10px]"
                    />
                    <span className="font-medium">
                      {a.childFirstName} {a.childLastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{a.familyName ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {a.desiredGradeLevelName ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {a.rejectionReasonLabel ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
                        style={{
                          backgroundColor:
                            a.rejectionReasonColor ?? "var(--muted)",
                        }}
                      />
                      {a.rejectionReasonLabel}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {a.rejectionReason ?? "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {a.rejectedBy ? (
                    <Badge variant="outline" className="text-[10px]">
                      {t(rejectedByKey(a.rejectedBy))}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {dateFmt(a.rejectedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ColHead({
  label,
  sortKey,
  active,
  dir,
  onClick,
  align,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  align?: "right";
}) {
  return (
    <TableHead className={cn(align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={cn(
          "inline-flex items-center hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {!active ? (
          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
        ) : dir === "asc" ? (
          <ArrowUp className="ml-1 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1 h-3 w-3" />
        )}
      </button>
    </TableHead>
  );
}
