"use client";

import * as React from "react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonCell } from "@/components/common/PersonCell";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import {
  type AppTableFeatures,
  useDataTable,
} from "@/components/data-table/use-data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { UserListItem } from "../actions/get-users.action";

interface Props {
  data: UserListItem[];
}

const fullName = (row: UserListItem) =>
  `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();

const initials = (row: UserListItem) =>
  ((row.firstName?.charAt(0)?.toUpperCase() ?? "") +
    (row.lastName?.charAt(0)?.toUpperCase() ?? "")) ||
  "?";

const primaryEmail = (row: UserListItem) => {
  const emails = row.userEmails;
  return emails?.find((e) => e.isPrimary)?.email ?? emails?.[0]?.email ?? "";
};

const orgNames = (row: UserListItem) =>
  (row.memberships ?? [])
    .map((m) => m.organization.name)
    .filter((n): n is string => !!n);

/** Search across first name, last name and email for the merged person column. */
const personFilter: FilterFn<AppTableFeatures, UserListItem> = (
  row,
  _columnId,
  value,
) => {
  const needle = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  const hay = `${fullName(row.original)} ${primaryEmail(
    row.original,
  )}`.toLowerCase();
  return hay.includes(needle);
};

const useColumns = (): ColumnDef<AppTableFeatures, UserListItem, unknown>[] => {
  const t = useTranslations("Common");
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
          subtitle={primaryEmail(row.original) || undefined}
        />
      ),
      filterFn: personFilter,
    },
    {
      id: "organization",
      accessorFn: (row) => orgNames(row).join(", "),
      header: t("organization"),
      enableSorting: false,
      filterFn: (row, id, value) => {
        const picks = value as string[] | undefined;
        if (!picks?.length) return true;
        const names = orgNames(row.original);
        return picks.some((pick) => names.includes(pick));
      },
      cell: ({ row }) => {
        const memberships = row.original.memberships;
        if (!memberships?.length)
          return <span className="text-muted-foreground">–</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {memberships.map((m) => (
              <Badge key={m.id} variant="secondary">
                {m.organization.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "loginMethods",
      header: t("loginMethods"),
      cell: ({ row }) => {
        const providers = new Set<string>();
        row.original.userEmails?.forEach((ue) =>
          ue.authAccounts?.forEach((aa) => providers.add(aa.provider)),
        );
        return (
          <div className="flex flex-wrap gap-1">
            {providers.has("GOOGLE") && (
              <Badge variant="outline">Google</Badge>
            )}
            {providers.has("APPLE") && (
              <Badge variant="outline">Apple</Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: "isActive",
      accessorFn: (row) => row.isActive,
      header: t("isActive"),
      // The filter dropdown hands over string values ("true"/"false"), while
      // the column itself holds a boolean.
      filterFn: (row, id, value) => {
        const picks = value as string[] | undefined;
        if (!picks?.length) return true;
        return picks.includes(String(row.getValue<boolean>(id)));
      },
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
            {t("active")}
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
            {t("inactive")}
          </Badge>
        ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const data = row.original;
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
                  href={ROUTES.admin.usersEdit(locale, data.id)}
                  className="flex gap-2"
                >
                  <Pencil className="h-4 w-4" /> {t("edit")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};

export const UsersTable = ({ data }: Props) => {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const columns = useColumns();

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    initialPageSize: 10,
  });

  // Organization names and the active/inactive status live in one filter
  // dropdown instead of a row of separate Select inputs.
  const filterGroups: FilterGroup[] = React.useMemo(() => {
    const names = Array.from(
      new Set(data.flatMap((u) => orgNames(u))),
    ).sort();

    const groups: FilterGroup[] = [];
    if (names.length > 0) {
      groups.push({
        id: "organization",
        label: t("organization"),
        options: names.map((name) => ({ value: name, label: name })),
      });
    }
    groups.push({
      id: "isActive",
      label: t("status"),
      options: [
        { value: "true", label: t("active") },
        { value: "false", label: t("inactive") },
      ],
    });
    return groups;
  }, [data, t]);

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={t("searchPlaceholder")}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      onRowClick={(row) => {
        router.push(ROUTES.admin.usersEdit(locale, row.original.id));
      }}
    />
  );
};
