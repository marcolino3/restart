"use client";

import * as React from "react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { PersonCell } from "@/components/common/PersonCell";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import type { BadgeProps } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { EmployeeListItem } from "../actions/get-employees.action";
import { EmployeeActionsCell } from "./EmployeeActionsCell";
import { EmployeeAvatar } from "./EmployeeAvatar";

interface Props {
  data: EmployeeListItem[];
}

/** Persona → status-pill variant, following the design-handoff role colours. */
const PERSONA_VARIANT: Record<string, BadgeProps["variant"]> = {
  TEACHER: "accent",
  ADMIN: "amber",
  HR: "amber",
  OFFICE: "sky",
  PARENT: "slate",
  STUDENT: "slate",
  EMPLOYEE: "green",
};

const fullName = (row: EmployeeListItem) =>
  `${row.membership.user?.firstName ?? ""} ${
    row.membership.user?.lastName ?? ""
  }`.trim();

const primaryEmail = (row: EmployeeListItem) => {
  const emails = row.membership.user?.userEmails;
  return emails?.find((e) => e.isPrimary)?.email ?? emails?.[0]?.email ?? "";
};

const teamNames = (row: EmployeeListItem) =>
  (row.teamMembers ?? [])
    .map((tm) => tm.team?.name)
    .filter((n): n is string => !!n);

/** Minutes → "+12:30" / "−2:15" (design handoff `.mono` Zeitsaldo). */
const formatBalance = (mins: number): string => {
  const sign = mins < 0 ? "−" : "+";
  const abs = Math.abs(mins);
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
};

/** Search across name + email for the merged person column. */
const personFilter: FilterFn<EmployeeListItem> = (row, _columnId, value) => {
  const needle = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  const hay = `${fullName(row.original)} ${primaryEmail(
    row.original,
  )}`.toLowerCase();
  return hay.includes(needle);
};

const useColumns = (): ColumnDef<EmployeeListItem>[] => {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");

  return [
    {
      id: "person",
      accessorFn: (row) => row.membership.user?.lastName ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("person")} />
      ),
      meta: { labelKey: "person" },
      cell: ({ row }) => (
        <PersonCell
          avatar={
            <EmployeeAvatar
              firstName={row.original.membership.user?.firstName}
              lastName={row.original.membership.user?.lastName}
              className="size-8"
            />
          }
          name={fullName(row.original) || "—"}
          subtitle={primaryEmail(row.original) || undefined}
        />
      ),
      filterFn: personFilter,
    },
    {
      id: "persona",
      accessorFn: (row) => row.membership.persona,
      header: t("role"),
      filterFn: (row, id, value) => {
        const picks = value as string[] | undefined;
        return !picks?.length || picks.includes(row.getValue<string>(id));
      },
      cell: ({ row }) => {
        const persona = row.original.membership.persona;
        return (
          <Badge variant={PERSONA_VARIANT[persona] ?? "slate"}>
            {t(persona)}
          </Badge>
        );
      },
    },
    {
      id: "team",
      accessorFn: (row) => teamNames(row).join(", "),
      header: t("team"),
      enableSorting: false,
      cell: ({ row }) => {
        const names = teamNames(row.original);
        return names.length ? (
          <span className="text-muted-foreground">{names.join(" · ")}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "workloadPercent",
      accessorFn: (row) => row.workloadPercent ?? -1,
      header: t("workloadPercent"),
      cell: ({ row }) => {
        const pct = row.original.workloadPercent;
        if (pct == null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="inline-flex items-center gap-[9px]">
            <span className="h-2 w-20 overflow-hidden rounded-full bg-field">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </span>
            <span className="text-[13px] tabular-nums">{pct}%</span>
          </span>
        );
      },
    },
    {
      id: "timeBalanceMinutes",
      accessorFn: (row) => row.timeBalanceMinutes ?? null,
      header: t("timeBalanceMinutes"),
      cell: ({ row }) => {
        const bal = row.original.timeBalanceMinutes;
        if (bal == null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="font-mono text-[12.5px] tabular-nums">
            {formatBalance(bal)}
          </span>
        );
      },
    },
    {
      id: "status",
      accessorFn: (row) => row.membership.employee?.isActive ?? true,
      header: tE("statusToday"),
      // The filter dropdown hands over string values ("true"/"false"), while
      // the column itself holds a boolean.
      filterFn: (row, id, value) => {
        const picks = value as string[] | undefined;
        if (!picks?.length) return true;
        return picks.includes(String(row.getValue<boolean>(id)));
      },
      cell: ({ row, getValue }) =>
        row.original.membership.employee?.status === "DRAFT" ? (
          <Badge variant="amber">{tE("statusDraft")}</Badge>
        ) : getValue<boolean>() ? (
          <Badge variant="green">{t("active")}</Badge>
        ) : (
          <Badge variant="slate">{t("inactive")}</Badge>
        ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => <EmployeeActionsCell row={row.original} />,
    },
  ];
};

/**
 * Persona buckets offered in the filter dropdown: Lehrkräfte, Administration
 * and Betreuung. Each bucket expands to the personas it covers, so the filter
 * stays multi-select instead of the previous mutually exclusive chips.
 */
const PERSONA_GROUPS = [
  { key: "TEACHERS", labelKey: "chipTeachers", personas: ["TEACHER"] },
  {
    key: "ADMIN",
    labelKey: "chipAdmin",
    personas: ["ADMIN", "HR", "OFFICE"],
  },
  {
    key: "CARE",
    labelKey: "chipCare",
    personas: ["EMPLOYEE"],
  },
] as const;

/**
 * Personas whose `Common` message key differs from the enum value. Everything
 * else resolves as `Common.<PERSONA>`.
 */
const PERSONA_LABEL_KEYS: Record<string, string> = {};

export const EmployeesTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();
  const columns = useColumns();

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    initialPageSize: 10,
  });

  // Persona groups and the active/inactive switch live in one filter dropdown
  // instead of a row of mutually exclusive chips.
  const filterGroups: FilterGroup[] = React.useMemo(
    () => [
      {
        id: "persona",
        label: tE("persona"),
        options: PERSONA_GROUPS.flatMap((group) =>
          group.personas.map((persona) => ({
            value: persona,
            label: t(PERSONA_LABEL_KEYS[persona] ?? persona),
          })),
        ),
      },
      {
        id: "status",
        label: t("status"),
        options: [
          { value: "true", label: t("active") },
          { value: "false", label: t("inactive") },
        ],
      },
    ],
    [t, tE],
  );

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={tE("searchPlaceholder")}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      onRowClick={(row) => {
        // A membership without an employee record has no detail page.
        const employeeId = row.original.membership.employee?.id;
        if (employeeId) {
          router.push(ROUTES.admin.employeesView(locale, employeeId));
        }
      }}
    />
  );
};
