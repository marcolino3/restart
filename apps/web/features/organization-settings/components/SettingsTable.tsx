"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import {
  type AppTableFeatures,
  useDataTable,
} from "@/components/data-table/use-data-table";
import { OrganizationSetting } from "../actions/get-settings.action";
import { getOrganizationSettingValueAction } from "../actions/get-setting-value.action";

interface Props {
  data: OrganizationSetting[];
  organizationId: string;
  onEdit: (setting: OrganizationSetting) => void;
  onDelete: (setting: OrganizationSetting) => void;
}

export const SettingsTable = ({ data, organizationId, onEdit, onDelete }: Props) => {
  const t = useTranslations("OrganizationSettings");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [revealedValues, setRevealedValues] = React.useState<Record<string, string>>({});
  const [loadingKeys, setLoadingKeys] = React.useState<Set<string>>(new Set());

  const toggleReveal = async (key: string) => {
    if (revealedValues[key]) {
      setRevealedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    setLoadingKeys((prev) => new Set(prev).add(key));

    const result = await getOrganizationSettingValueAction(organizationId, key);

    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (result.success && result.data?.value) {
      setRevealedValues((prev) => ({
        ...prev,
        [key]: result.data!.value!,
      }));
    }
  };

  const columns: ColumnDef<AppTableFeatures, OrganizationSetting, unknown>[] = React.useMemo(
    () => [
      {
        id: "key",
        accessorKey: "key",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("key")} />
        ),
        meta: { labelKey: "key" },
        cell: ({ row }) => (
          <code className="bg-muted rounded px-2 py-1 text-sm font-mono">
            {row.getValue("key")}
          </code>
        ),
      },
      {
        id: "value",
        header: t("valueHeader"),
        enableSorting: false,
        cell: ({ row }) => {
          const key = row.original.key;
          const isLoading = loadingKeys.has(key);
          const revealed = revealedValues[key];

          return (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">
                {revealed || "••••••••••••"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleReveal(key)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : revealed ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        },
      },
      {
        id: "description",
        accessorKey: "description",
        header: t("descriptionLabel"),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.getValue("description") || "-"}
          </span>
        ),
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("updatedHeader")} />
        ),
        meta: { labelKey: "updatedHeader" },
        cell: ({ row }) => {
          const date = new Date(row.getValue("updatedAt"));
          return (
            <span className="text-muted-foreground text-sm">
              {date.toLocaleDateString(locale, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const setting = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{tCommon("openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{tCommon("actions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(setting)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {tCommon("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(setting)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tCommon("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t/tCommon are stable next-intl translators
    [loadingKeys, revealedValues, locale, onEdit, onDelete],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    getRowId: (row) => row.key,
    initialPageSize: 10,
  });

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={t("filterPlaceholder")}
      translateColumn={(key) => t(key)}
      toolbar={
        // `ml-auto` mirrors the pre-migration layout: the count badge sits at
        // the far right of the toolbar row, ahead of the view-options button.
        <Badge variant="secondary" className="ml-auto">
          {t("settingsCount", { count: data.length })}
        </Badge>
      }
      emptyState={
        <span className="text-[13.5px] text-muted-foreground">
          {t("noSettings")}
        </span>
      }
    />
  );
};
