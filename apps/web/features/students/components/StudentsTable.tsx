"use client";

import * as React from "react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";

import { multiSelectFilter } from "@/lib/table/locale-sorting";
import {
  Mars,
  MoreHorizontal,
  Pencil,
  Trash2,
  Venus,
  VenusAndMars,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PersonCell } from "@/components/common/PersonCell";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import {
  type AppTableFeatures,
  useDataTable,
} from "@/components/data-table/use-data-table";
import { ROUTES } from "@/constants/routes";
import { StudentListItem } from "../actions/get-students.action";
import { deleteStudentAction } from "../actions/delete-student.action";
import { StudentAvatar } from "./StudentAvatar";
import { handleAction } from "@/lib/actions/handle-action";
import {
  useUser,
  usePermissions,
} from "@/features/users/context/current-user.context";
import { hasAdminRole } from "@/features/users/lib/admin-roles";

interface Props {
  data: StudentListItem[];
}

const GENDER_META: Record<string, { icon: LucideIcon; className: string }> = {
  MALE: { icon: Mars, className: "text-blue-600 dark:text-blue-400" },
  FEMALE: { icon: Venus, className: "text-pink-600 dark:text-pink-400" },
  OTHER: {
    icon: VenusAndMars,
    className: "text-purple-600 dark:text-purple-400",
  },
};

const fullName = (row: StudentListItem) =>
  `${row.firstName} ${row.lastName}`.trim();

/** Whole years between a birthdate and now. */
const ageFromDob = (dob: string): number => {
  const b = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
};

/** Search across first + last name for the merged name column. */
const nameFilter: FilterFn<AppTableFeatures, StudentListItem> = (
  row,
  _columnId,
  value,
) => {
  const needle = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  return fullName(row.original).toLowerCase().includes(needle);
};

/** True if the row's gradeLevels array shares at least one value with filterValue. */
const arrIncludesSomeFilter: FilterFn<AppTableFeatures, StudentListItem> = (
  row,
  columnId,
  filterValue,
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const rowValues = row.getValue<string[]>(columnId);
  return filterValue.some((v) => rowValues.includes(v));
};

const useColumns = (): ColumnDef<AppTableFeatures, StudentListItem, unknown>[] => {
  const t = useTranslations("Common");
  const tS = useTranslations("Students");
  const locale = useLocale();
  const user = useUser();
  const canEditOrDelete =
    (user?.isSuperAdmin ?? false) || hasAdminRole(user?.roles);
  const { canReadField } = usePermissions();
  const dobVisible = canReadField("student", "dateOfBirth");

  const columns: ColumnDef<AppTableFeatures, StudentListItem, unknown>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label={t("selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "name",
      accessorKey: "lastName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("name")} />
      ),
      meta: { labelKey: "name" },
      cell: ({ row }) => {
        const s = row.original;
        const dob = dobVisible ? s.dateOfBirth : undefined;
        const subtitle = dob
          ? tS("birthInfo", {
              date: new Date(dob).toLocaleDateString("de-CH"),
              age: ageFromDob(dob),
            })
          : undefined;
        return (
          <PersonCell
            avatar={
              <StudentAvatar
                firstName={s.firstName}
                lastName={s.lastName}
                photoUrl={s.photoUrl}
                className="size-8"
                fallbackClassName="text-[11px]"
              />
            }
            name={fullName(s) || "—"}
            subtitle={subtitle}
          />
        );
      },
      filterFn: nameFilter,
    },
    {
      id: "gender",
      accessorKey: "gender",
      header: t("gender"),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        if (!value) return null;
        const meta = GENDER_META[value];
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <span title={t(value)} aria-label={t(value)}>
            <Icon className={`h-4 w-4 ${meta.className}`} aria-hidden />
          </span>
        );
      },
      filterFn: multiSelectFilter,
    },
    {
      id: "class",
      accessorFn: (row) => row.currentClass?.name ?? "",
      header: t("class"),
      cell: ({ row }) => {
        const cls = row.original.currentClass;
        if (!cls?.name) {
          return <span className="text-muted-foreground">–</span>;
        }
        return (
          // Colour as a dot, not as a filled chip: the class palette is
          // user-chosen and unreadable behind white text at some values. The
          // class list and the kanban already show it this way.
          <Badge variant="accent" className="gap-1.5">
            {cls.color && (
              <i
                className="inline-block size-[7px] shrink-0 rounded-full"
                style={{ background: cls.color }}
              />
            )}
            {cls.name}
          </Badge>
        );
      },
      filterFn: multiSelectFilter,
    },
    {
      id: "gradeLevel",
      accessorFn: (row) =>
        (row.currentClass?.gradeLevels ?? []).map((gl) => gl.name),
      header: t("gradeLevel"),
      cell: ({ row }) => {
        const gradeLevels = row.original.currentClass?.gradeLevels ?? [];
        return gradeLevels.length ? (
          <div className="flex flex-wrap gap-1">
            {gradeLevels.map((gl) => (
              <Badge key={gl.id} variant="secondary" className="gap-1.5">
                {gl.color && (
                  <i
                    className="inline-block size-[7px] shrink-0 rounded-full"
                    style={{ background: gl.color }}
                  />
                )}
                {gl.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">–</span>
        );
      },
      filterFn: arrIncludesSomeFilter,
    },
    {
      id: "status",
      accessorFn: (row) => row.isActive,
      header: t("status"),
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="green">{t("active")}</Badge>
        ) : (
          <Badge variant="slate">{t("inactive")}</Badge>
        ),
    },
  ];

  if (canEditOrDelete) {
    columns.push({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("openMenu")}</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={ROUTES.admin.studentsEdit(locale, student.id)}
                  className="flex gap-2"
                >
                  <Pencil className="h-4 w-4" /> {t("edit")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={async () => {
                  await handleAction({
                    action: () => deleteStudentAction(student.id),
                    successMessage: tS("studentDeleted"),
                    errorMessage: tS("studentDeleteError"),
                  });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
};

export const StudentsTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const tS = useTranslations("Students");
  const locale = useLocale();
  const router = useRouter();
  const columns = useColumns();

  // Distinct option lists for the categorical filters, derived from the data.
  const genderOptions = React.useMemo(
    () =>
      Array.from(
        new Set(data.map((s) => s.gender).filter((g): g is string => !!g)),
      ),
    [data],
  );
  const classOptions = React.useMemo(() => {
    const byName = new Map<string, string | null>();
    for (const s of data) {
      const cls = s.currentClass;
      if (cls?.name && !byName.has(cls.name)) {
        byName.set(cls.name, cls.color ?? null);
      }
    }
    return Array.from(byName, ([name, color]) => ({ name, color })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  }, [data]);
  /**
   * Grade levels as a two-level tree: top-level Stufen with their subgroups
   * indented underneath. A parent that no student sits on directly still shows
   * up as a heading so its children aren't orphaned.
   */
  const gradeLevelOptions = React.useMemo(() => {
    type Node = {
      name: string;
      color: string | null;
      parentName: string | null;
    };

    const byName = new Map<string, Node>();

    for (const s of data) {
      for (const gl of s.currentClass?.gradeLevels ?? []) {
        if (!byName.has(gl.name)) {
          byName.set(gl.name, {
            name: gl.name,
            color: gl.color ?? null,
            parentName: gl.parent?.name ?? null,
          });
        }
        // Surface a parent that has no students of its own.
        if (gl.parent?.name && !byName.has(gl.parent.name)) {
          byName.set(gl.parent.name, {
            name: gl.parent.name,
            color: null,
            parentName: null,
          });
        }
      }
    }

    const nodes = Array.from(byName.values());
    const byLabel = (a: Node, b: Node) => a.name.localeCompare(b.name);

    return nodes
      .filter((n) => !n.parentName)
      .sort(byLabel)
      .flatMap((parent) => [
        { ...parent, depth: 0 },
        ...nodes
          .filter((n) => n.parentName === parent.name)
          .sort(byLabel)
          .map((child) => ({ ...child, depth: 1 })),
      ]);
  }, [data]);

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    initialPageSize: 10,
  });

  // All categorical filters live in one dropdown instead of sitting side by
  // side in the toolbar.
  const filterGroups: FilterGroup[] = React.useMemo(() => {
    const groups: FilterGroup[] = [];

    if (genderOptions.length > 0) {
      groups.push({
        id: "gender",
        label: t("gender"),
        options: genderOptions.map((gender) => ({
          value: gender,
          label: t(gender),
        })),
      });
    }

    if (classOptions.length > 0) {
      groups.push({
        id: "class",
        label: t("class"),
        options: classOptions.map(({ name, color }) => ({
          value: name,
          label: name,
          color: color ?? undefined,
        })),
      });
    }

    if (gradeLevelOptions.length > 0) {
      groups.push({
        id: "gradeLevel",
        label: t("gradeLevel"),
        options: gradeLevelOptions.map(({ name, color, depth }) => ({
          value: name,
          label: name,
          color: color ?? undefined,
          depth,
        })),
      });
    }

    return groups;
  }, [genderOptions, classOptions, gradeLevelOptions, t]);

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={tS("searchPlaceholder")}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      onRowClick={(row) =>
        router.push(ROUTES.admin.studentsView(locale, row.original.id))
      }
    />
  );
};
