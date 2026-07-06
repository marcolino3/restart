"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus, Check } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    return Array.from(map.entries())
      .map(([countryCode, set]) => ({
        countryCode,
        countryName: getCountryName(countryCode, locale),
        fieldTypes: Array.from(set).sort(),
      }))
      .sort((a, b) => a.countryName.localeCompare(b.countryName, locale));
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

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("addCountry")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("country")}</TableHead>
            <TableHead>{t("code")}</TableHead>
            <TableHead>{t("configuredFields")}</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground py-8 text-center"
              >
                {t("noCountries")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow
                key={r.countryCode}
                className="hover:bg-muted/40 cursor-pointer"
                onClick={() => goToDetail(r.countryCode)}
              >
                <TableCell className="font-medium">{r.countryName}</TableCell>
                <TableCell className="font-mono">{r.countryCode}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {r.fieldTypes.map((ft) => (
                    <Badge key={ft} variant="secondary">
                      {ft}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell className="text-right">
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
