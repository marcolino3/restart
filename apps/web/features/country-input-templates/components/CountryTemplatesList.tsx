"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus, Check } from "lucide-react";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";

import { CountryInputTemplate } from "../types";
import { getAllCountries, getCountryName } from "../lib/countries";

type CountryRow = {
  countryCode: string;
  countryName: string;
  fieldTypes: string[];
};

export const CountryTemplatesList = ({
  initial,
  locale,
}: {
  initial: CountryInputTemplate[];
  locale: string;
}) => {
  const router = useRouter();
  const t = useTranslations("CountryTemplates");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const rows: CountryRow[] = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const t of initial) {
      const set = map.get(t.countryCode) ?? new Set<string>();
      set.add(t.fieldType);
      map.set(t.countryCode, set);
    }
    // Row order is left to the table's locale-aware sorting.
    return Array.from(map.entries()).map(([countryCode, set]) => ({
      countryCode,
      countryName: getCountryName(countryCode, locale),
      fieldTypes: Array.from(set).sort(),
    }));
  }, [initial, locale]);

  const allCountries = useMemo(() => getAllCountries(locale), [locale]);
  const existingCodes = useMemo(
    () => new Set(rows.map((r) => r.countryCode)),
    [rows],
  );

  const goToDetail = (countryCode: string) => {
    router.push(ROUTES.admin.countryTemplatesDetail(locale, countryCode));
  };

  const confirmAdd = () => {
    if (!selected) return;
    setAddOpen(false);
    goToDetail(selected);
  };

  const columns = useMemo<ColumnDef<CountryRow>[]>(
    () => [
      {
        id: "countryName",
        accessorKey: "countryName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("country")} />
        ),
        meta: { labelKey: "country" },
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue<string>()}</span>
        ),
      },
      {
        id: "countryCode",
        accessorKey: "countryCode",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("code")} />
        ),
        meta: { labelKey: "code" },
        cell: ({ getValue }) => (
          <span className="font-mono">{getValue<string>()}</span>
        ),
      },
      {
        id: "fieldTypes",
        accessorKey: "fieldTypes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("configuredFields")} />
        ),
        meta: { labelKey: "configuredFields" },
        filterFn: "arrIncludesSome",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.fieldTypes.map((ft) => (
              <Badge key={ft} variant="secondary">
                {ft}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: "chevron",
        enableHiding: false,
        enableSorting: false,
        header: () => null,
        cell: () => (
          <div className="text-right">
            <ChevronRight className="text-muted-foreground h-4 w-4" />
          </div>
        ),
      },
    ],
    [t],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: rows,
    columns,
    initialSorting: [{ id: "countryName", desc: false }],
  });

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const fieldTypes = Array.from(
      new Set(rows.flatMap((r) => r.fieldTypes)),
    ).sort();
    if (fieldTypes.length === 0) return [];
    return [
      {
        id: "fieldTypes",
        label: t("configuredFields"),
        options: fieldTypes.map((ft) => ({ value: ft, label: ft })),
      },
    ];
  }, [rows, t]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("addCountry")}
        </Button>
      </div>

      <DataTable
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={t("searchCountry")}
        filterGroups={filterGroups}
        translateColumn={(key) => t(key)}
        onRowClick={(row) => goToDetail(row.original.countryCode)}
        emptyState={
          <span className="text-muted-foreground text-sm">
            {t("noCountries")}
          </span>
        }
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addCountry")}</DialogTitle>
            <DialogDescription>{t("addCountryDescription")}</DialogDescription>
          </DialogHeader>

          <Command>
            <CommandInput placeholder={t("searchCountry")} />
            <CommandList>
              <CommandEmpty>{t("noMatches")}</CommandEmpty>
              <CommandGroup>
                {allCountries.map((c) => {
                  const exists = existingCodes.has(c.code);
                  return (
                    <CommandItem
                      key={c.code}
                      value={`${c.name} ${c.code}`}
                      onSelect={() => setSelected(c.code)}
                      disabled={exists}
                    >
                      <span className="flex-1">{c.name}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {c.code}
                      </span>
                      {selected === c.code && (
                        <Check className="ml-2 h-4 w-4" />
                      )}
                      {exists && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          {t("exists")}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={confirmAdd} disabled={!selected}>
              {t("next")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
