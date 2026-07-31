"use client";

import * as React from "react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PersonCell } from "@/components/common/PersonCell";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { archiveContactPersonAction } from "../actions/archive-contact-person.action";
import { ContactPersonListItem } from "../actions/get-contact-persons.action";

interface Props {
  data: ContactPersonListItem[];
}

const fullName = (row: ContactPersonListItem) =>
  `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();

const initials = (row: ContactPersonListItem) =>
  ((row.firstName?.charAt(0)?.toUpperCase() ?? "") +
    (row.lastName?.charAt(0)?.toUpperCase() ?? "")) ||
  "?";

/** Search across name + email for the merged person column. */
const personFilter: FilterFn<ContactPersonListItem> = (row, _columnId, value) => {
  const needle = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  const hay = `${fullName(row.original)} ${
    row.original.email ?? ""
  }`.toLowerCase();
  return hay.includes(needle);
};

const useColumns = (): ColumnDef<ContactPersonListItem>[] => {
  const t = useTranslations("Common");
  const tC = useTranslations("ContactPersons");
  const locale = useLocale();

  return [
    {
      id: "person",
      accessorFn: (row) => row.lastName ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("person")} />
      ),
      meta: { labelKey: "person" },
      cell: ({ row }) => (
        <PersonCell
          avatar={
            <Avatar className="size-8">
              <AvatarFallback className="bg-accent font-bold text-accent-foreground">
                {initials(row.original)}
              </AvatarFallback>
            </Avatar>
          }
          name={fullName(row.original) || "—"}
          subtitle={row.original.email || undefined}
        />
      ),
      filterFn: personFilter,
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: tC("phone"),
      enableSorting: false,
      cell: ({ row }) => {
        const phone = row.original.phone ?? row.original.mobile;
        return phone ? (
          <span className="font-mono text-[12.5px] tabular-nums">{phone}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "occupation",
      accessorKey: "occupation",
      header: tC("occupation"),
      // The occupation filter is multi-select (see filterGroups below), so it
      // needs the array-membership variant instead of substring matching.
      filterFn: (row, id, value) => {
        const picks = value as string[] | undefined;
        return !picks?.length || picks.includes(row.getValue<string>(id));
      },
      cell: ({ getValue }) => (
        <div className="text-sm text-muted-foreground">
          {getValue<string | null>() ?? ""}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const cp = row.original;
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
                  href={ROUTES.admin.contactPersonsEdit(locale, cp.id)}
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
                    action: () => archiveContactPersonAction(cp.id),
                    successMessage: tC("contactPersonArchived"),
                    errorMessage: tC("contactPersonArchiveError"),
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
    },
  ];
};

export const ContactPersonsTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const tC = useTranslations("ContactPersons");
  const locale = useLocale();
  const router = useRouter();
  const columns = useColumns();

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    initialPageSize: 10,
  });

  // Occupations are free text, so the filter's options are derived from
  // whatever values are actually present in the data instead of a fixed enum.
  const filterGroups: FilterGroup[] = React.useMemo(() => {
    const occupations = Array.from(
      new Set(
        data
          .map((cp) => cp.occupation)
          .filter((o): o is string => !!o && o.trim().length > 0),
      ),
    ).sort();

    if (occupations.length === 0) return [];

    return [
      {
        id: "occupation",
        label: tC("occupation"),
        options: occupations.map((o) => ({ value: o, label: o })),
      },
    ];
  }, [data, tC]);

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={tC("searchPlaceholder")}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      onRowClick={(row) => {
        router.push(
          ROUTES.admin.contactPersonsEdit(locale, row.original.id),
        );
      }}
    />
  );
};
