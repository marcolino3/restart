"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type {
  AccessorFn,
  CellContext,
  ColumnDef,
  ColumnDefTemplate,
  FilterFn,
} from "@tanstack/react-table";
import { Bell, BellRing, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import { multiSelectFilter } from "@/lib/table/locale-sorting";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { PersonCell } from "@/components/common/PersonCell";
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

const GENDER_GLYPH: Record<
  NonNullable<KanbanApplication["childGender"]>,
  string
> = {
  MALE: "♂",
  FEMALE: "♀",
  OTHER: "⚧",
};

/** Columns rendered right-aligned because they hold a number. */
const NUMERIC_COLUMNS = new Set<TableColumnKey>(["days", "reminders"]);

/** Columns offered in the filter dropdown, as categorical multi-selects. */
const FILTERABLE_COLUMNS = new Set<TableColumnKey>([
  "stage",
  "gradeLevel",
  "gender",
  "source",
  "status",
]);

const daysInStage = (a: KanbanApplication, now: number): number =>
  Math.max(
    0,
    Math.floor((now - new Date(a.stageEnteredAt).getTime()) / 86_400_000),
  );

export function AdmissionsList({
  stages,
  tableColumns,
  applications,
  onOpenCard,
}: Props) {
  const t = useTranslations("Admissions");
  const tCommon = useTranslations("Common");
  const columnKeys = resolveTableColumns(tableColumns);

  const stageById = useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages],
  );
  const stagePosById = useMemo(
    () => new Map(stages.map((s, i) => [s.id, i])),
    [stages],
  );

  // Computed once per render (client-only: AdmissionsKanban gates rendering
  // behind `mounted`), so every row measures against the same instant.
  // eslint-disable-next-line react-hooks/purity -- client-only render, stable for this render pass
  const now = Date.now();

  const columns = useMemo<ColumnDef<KanbanApplication>[]>(() => {
    /** The fixed leading column: avatar + child name + birth year. */
    const childColumn: ColumnDef<KanbanApplication> = {
      id: "child",
      accessorFn: (a) => `${a.childLastName} ${a.childFirstName}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("listColChild")} />
      ),
      meta: { labelKey: "listColChild" },
      cell: ({ row }) => {
        const a = row.original;
        const birthYear = a.childDateOfBirth?.slice(0, 4);
        return (
          <PersonCell
            avatar={
              <StudentAvatar
                firstName={a.childFirstName}
                lastName={a.childLastName}
                className="size-8"
                fallbackClassName="text-[11px]"
              />
            }
            name={`${a.childFirstName} ${a.childLastName}`.trim() || "—"}
            subtitle={birthYear ? `Jg. ${birthYear}` : undefined}
          />
        );
      },
    };

    /**
     * Per-column parts, kept as a plain shape rather than a `ColumnDef`:
     * `ColumnDef` is a union, and spreading a union value below loses the
     * `accessorFn` discriminant. The header/meta are added uniformly after.
     */
    type ColumnParts = {
      accessorFn: AccessorFn<KanbanApplication>;
      cell: ColumnDefTemplate<CellContext<KanbanApplication, unknown>>;
      filterFn?: FilterFn<KanbanApplication>;
    };

    const byKey: Record<TableColumnKey, ColumnParts> = {
      stage: {
        // Sorts by the stage's board position, not its name — the pipeline
        // order is what the user reads out of this column.
        accessorFn: (a) => stagePosById.get(a.admissionStageId) ?? 999,
        // The accessor is the board position, so the filter can't go through
        // `multiSelectFilter` — it matches the stage name shown in the cell.
        filterFn: (row, _id, value) => {
          if (!Array.isArray(value) || value.length === 0) return true;
          const name = stageById.get(row.original.admissionStageId)?.name ?? "";
          return value.includes(name);
        },
        cell: ({ row }) => {
          const stage = stageById.get(row.original.admissionStageId);
          if (!stage) return null;
          return (
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
          );
        },
      },
      gradeLevel: {
        accessorFn: (a) => a.assignedGradeLevelName ?? "",
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const a = row.original;
          if (!a.assignedGradeLevelName) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <Badge variant="secondary" className="gap-1.5">
              <i
                aria-hidden
                className="inline-block size-[7px] shrink-0 rounded-full"
                style={{
                  background: a.assignedGradeLevelColor ?? "var(--muted)",
                }}
              />
              {a.assignedGradeLevelName}
            </Badge>
          );
        },
      },
      family: {
        accessorFn: (a) => a.family.name ?? "",
        cell: ({ row }) => {
          const family = row.original.family;
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="truncate">{family.name ?? "—"}</span>
              {family.childrenCount > 1 && (
                <Badge variant="secondary" className="gap-0.5 text-[10px]">
                  <Users2 className="h-2.5 w-2.5" />
                  {family.childrenCount}
                </Badge>
              )}
            </div>
          );
        },
      },
      gender: {
        accessorFn: (a) => a.childGender ?? "",
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const gender = row.original.childGender;
          if (!gender) return <span className="text-muted-foreground">—</span>;
          return (
            <span title={t("fieldGender")} aria-label={t("fieldGender")}>
              {GENDER_GLYPH[gender]}
            </span>
          );
        },
      },
      source: {
        accessorFn: (a) => a.admissionSource?.name ?? "",
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const source = row.original.admissionSource;
          if (!source) {
            return <span className="text-xs text-muted-foreground/50">—</span>;
          }
          return (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {source.color && (
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
              )}
              {source.name}
            </span>
          );
        },
      },
      status: {
        accessorFn: (a) => a.status,
        filterFn: multiSelectFilter,
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {t(statusKey(row.original.status))}
          </Badge>
        ),
      },
      days: {
        accessorFn: (a) => daysInStage(a, now),
        cell: ({ getValue }) => {
          const days = getValue<number>();
          return (
            <Badge
              variant={days > 14 ? "destructive" : "outline"}
              className="text-[10px]"
            >
              {days}d
            </Badge>
          );
        },
      },
      contact: {
        accessorFn: (a) => a.family.contactNames[0] ?? "",
        cell: ({ getValue }) => (
          <span className="truncate text-sm">{getValue<string>() || "—"}</span>
        ),
      },
      reminders: {
        accessorFn: (a) => a.openRemindersCount,
        cell: ({ row }) => {
          const a = row.original;
          if (a.openRemindersCount === 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                a.overdueRemindersCount > 0
                  ? "bg-status-rose text-status-rose-foreground"
                  : "bg-status-amber text-status-amber-foreground",
              )}
            >
              {a.overdueRemindersCount > 0 ? (
                <BellRing className="h-3.5 w-3.5" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
              {a.openRemindersCount}
            </span>
          );
        },
      },
    };

    return [
      childColumn,
      ...columnKeys.map((key): ColumnDef<KanbanApplication> => {
        const title = t(TABLE_COLUMN_LABEL[key]);
        return {
          id: key,
          ...byKey[key],
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={title}
              className={cn(NUMERIC_COLUMNS.has(key) && "justify-end")}
            />
          ),
          meta: { labelKey: TABLE_COLUMN_LABEL[key] },
        };
      }),
    ];
  }, [columnKeys, stageById, stagePosById, now, t]);

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: applications,
    columns,
    initialSorting: [{ id: "child", desc: false }],
  });

  // Categorical filter groups, derived from the rows actually present. Only
  // the configured columns are offered, so the dropdown mirrors the table.
  const filterGroups = useMemo<FilterGroup[]>(() => {
    const groups: FilterGroup[] = [];

    const push = (
      key: TableColumnKey,
      options: { value: string; label: string; color?: string }[],
    ) => {
      const seen = new Map<string, { value: string; label: string; color?: string }>();
      for (const option of options) {
        if (option.value && !seen.has(option.value)) seen.set(option.value, option);
      }
      if (seen.size > 0) {
        groups.push({
          id: key,
          label: t(TABLE_COLUMN_LABEL[key]),
          options: Array.from(seen.values()).sort((a, b) =>
            a.label.localeCompare(b.label),
          ),
        });
      }
    };

    for (const key of columnKeys) {
      if (!FILTERABLE_COLUMNS.has(key)) continue;

      switch (key) {
        case "stage":
          push(
            key,
            applications.map((a) => {
              const stage = stageById.get(a.admissionStageId);
              return {
                value: stage?.name ?? "",
                label: stage?.name ?? "",
                color: stage?.color ?? undefined,
              };
            }),
          );
          break;
        case "gradeLevel":
          push(
            key,
            applications.map((a) => ({
              value: a.assignedGradeLevelName ?? "",
              label: a.assignedGradeLevelName ?? "",
              color: a.assignedGradeLevelColor ?? undefined,
            })),
          );
          break;
        case "gender":
          push(
            key,
            applications.map((a) => ({
              value: a.childGender ?? "",
              label: a.childGender ? tCommon(a.childGender) : "",
            })),
          );
          break;
        case "source":
          push(
            key,
            applications.map((a) => ({
              value: a.admissionSource?.name ?? "",
              label: a.admissionSource?.name ?? "",
              color: a.admissionSource?.color ?? undefined,
            })),
          );
          break;
        case "status":
          push(
            key,
            applications.map((a) => ({
              value: a.status,
              label: t(statusKey(a.status)),
            })),
          );
          break;
      }
    }

    return groups;
  }, [columnKeys, applications, stageById, t, tCommon]);

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={t("listSearchPlaceholder")}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      emptyState={
        <span className="text-xs italic text-muted-foreground">
          {t("listEmpty")}
        </span>
      }
      onRowClick={(row) => onOpenCard(row.original.id)}
    />
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

/** Theme-aware status pill colour per application status. */
function statusVariant(
  status: KanbanApplication["status"],
): "green" | "rose" | "accent" | "slate" {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "REJECTED":
      return "rose";
    case "ENROLLED":
      return "accent";
    case "ARCHIVED":
    default:
      return "slate";
  }
}
