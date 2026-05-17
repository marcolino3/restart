"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronsUpDown, X } from "lucide-react";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type {
  CurriculumNodeType,
  LessonAncestor,
  LessonOption,
} from "../types";

interface Props<TFormValues extends FieldValues> {
  name: FieldPath<TFormValues>;
  lessons: LessonOption[];
  label?: string;
  /** i18n namespace for label/placeholder/filter strings. Default "RecordKeeping". */
  namespace?: string;
  className?: string;
}

const pickName = (
  translations: { locale: string; name: string }[],
  locale: string,
): string => {
  const normalized = locale.toUpperCase();
  return (
    translations.find((t) => t.locale === normalized)?.name ??
    translations[0]?.name ??
    "—"
  );
};

const findAncestor = (
  lesson: LessonOption,
  type: CurriculumNodeType,
): LessonAncestor | undefined =>
  lesson.ancestors?.find((a) => a.nodeType === type);

const BREADCRUMB_SEP = " › ";

/**
 * Lesson picker for the RecordKeeping bulk-entry form.
 * - Filter chips by AREA / TOPIC / GROUP (multi-select, cascading)
 * - Search across lesson name + all ancestor names
 * - Items grouped by AREA, sorted Curriculum-order (position)
 * - Trigger shows lesson name + breadcrumb subtitle for the selected lesson
 */
export function LessonCombobox<TFormValues extends FieldValues>({
  name,
  lessons,
  label,
  namespace = "RecordKeeping",
  className,
}: Props<TFormValues>) {
  const t = useTranslations(namespace);
  const locale = useLocale();
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  // Lookup-Maps für Ancestor-Namen
  const ancestorNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of lessons) {
      for (const a of l.ancestors ?? []) {
        m.set(a.id, pickName(a.translations, locale));
      }
    }
    return m;
  }, [lessons, locale]);

  // Verfügbare Areas (immer aus dem Gesamt-Pool)
  const allAreas = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of lessons) {
      const a = findAncestor(l, "AREA");
      if (a) m.set(a.id, pickName(a.translations, locale));
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lessons, locale]);

  // Topics: nur jene aus Lessons, die zu den selektierten Areas passen
  const availableTopics = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of lessons) {
      const area = findAncestor(l, "AREA");
      if (selectedAreas.size > 0 && (!area || !selectedAreas.has(area.id)))
        continue;
      const topic = findAncestor(l, "TOPIC");
      if (topic) m.set(topic.id, pickName(topic.translations, locale));
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lessons, selectedAreas, locale]);

  // Groups: passend zu Areas + Topics
  const availableGroups = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of lessons) {
      const area = findAncestor(l, "AREA");
      if (selectedAreas.size > 0 && (!area || !selectedAreas.has(area.id)))
        continue;
      const topic = findAncestor(l, "TOPIC");
      if (selectedTopics.size > 0 && (!topic || !selectedTopics.has(topic.id)))
        continue;
      const group = findAncestor(l, "GROUP");
      if (group) m.set(group.id, pickName(group.translations, locale));
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lessons, selectedAreas, selectedTopics, locale]);

  // Gefilterte + sortierte Lessons, gruppiert nach AREA
  const groupedFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = lessons.filter((l) => {
      const area = findAncestor(l, "AREA");
      const topic = findAncestor(l, "TOPIC");
      const group = findAncestor(l, "GROUP");

      if (selectedAreas.size > 0 && (!area || !selectedAreas.has(area.id)))
        return false;
      if (selectedTopics.size > 0 && (!topic || !selectedTopics.has(topic.id)))
        return false;
      if (selectedGroups.size > 0 && (!group || !selectedGroups.has(group.id)))
        return false;

      if (!q) return true;
      const lessonName = pickName(l.translations, locale).toLowerCase();
      const ancestorNames = (l.ancestors ?? [])
        .map((a) => pickName(a.translations, locale).toLowerCase())
        .join(" ");
      return lessonName.includes(q) || ancestorNames.includes(q);
    });

    // Group by AREA-id, sort Areas alphabetically, lessons within by position
    const byArea = new Map<
      string,
      { areaId: string; areaName: string; items: LessonOption[] }
    >();
    const noAreaKey = "__no_area__";
    for (const l of filtered) {
      const area = findAncestor(l, "AREA");
      const key = area?.id ?? noAreaKey;
      const areaName = area
        ? pickName(area.translations, locale)
        : t("noLessonsFound");
      if (!byArea.has(key)) {
        byArea.set(key, { areaId: key, areaName, items: [] });
      }
      byArea.get(key)!.items.push(l);
    }
    const groups = Array.from(byArea.values());
    groups.sort((a, b) => a.areaName.localeCompare(b.areaName));
    for (const g of groups) {
      g.items.sort((a, b) => a.position - b.position);
    }
    return groups;
  }, [lessons, search, selectedAreas, selectedTopics, selectedGroups, locale, t]);

  const anyFilterActive =
    selectedAreas.size > 0 ||
    selectedTopics.size > 0 ||
    selectedGroups.size > 0;

  const resetAllFilters = () => {
    setSelectedAreas(new Set());
    setSelectedTopics(new Set());
    setSelectedGroups(new Set());
  };

  const breadcrumbFor = (l: LessonOption): string => {
    const area = findAncestor(l, "AREA");
    const topic = findAncestor(l, "TOPIC");
    const group = findAncestor(l, "GROUP");
    const parts: string[] = [];
    if (area) parts.push(pickName(area.translations, locale));
    if (topic) parts.push(pickName(topic.translations, locale));
    if (group) parts.push(pickName(group.translations, locale));
    return parts.join(BREADCRUMB_SEP);
  };

  const topicGroupSubtitle = (l: LessonOption): string => {
    const topic = findAncestor(l, "TOPIC");
    const group = findAncestor(l, "GROUP");
    const parts: string[] = [];
    if (topic) parts.push(pickName(topic.translations, locale));
    if (group) parts.push(pickName(group.translations, locale));
    return parts.join(BREADCRUMB_SEP);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = lessons.find((l) => l.id === field.value);
        const selectedName = selected
          ? pickName(selected.translations, locale)
          : null;
        const selectedBreadcrumb = selected ? breadcrumbFor(selected) : null;

        return (
          <FormItem className={cn("flex flex-col gap-2", className)}>
            {label && <FormLabel>{label}</FormLabel>}
            <Popover open={open} onOpenChange={setOpen} modal>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between h-auto min-h-9 py-1.5",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      {selectedName ? (
                        <>
                          <span className="truncate font-medium">
                            {selectedName}
                          </span>
                          {selectedBreadcrumb && (
                            <span className="truncate text-[10px] text-muted-foreground">
                              {selectedBreadcrumb}
                            </span>
                          )}
                        </>
                      ) : (
                        <span>{t("selectLesson")}</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 z-[100] w-[--radix-popover-trigger-width] min-w-[320px]"
                sideOffset={4}
                align="start"
              >
                {/* Filter-Chips-Reihe */}
                <div className="flex items-center gap-1.5 p-2 border-b flex-wrap">
                  <FilterChip
                    label={t("filterByArea")}
                    selectedIds={selectedAreas}
                    options={allAreas}
                    onToggle={(id) =>
                      setSelectedAreas((prev) => toggleSet(prev, id))
                    }
                    onClear={() => {
                      setSelectedAreas(new Set());
                      setSelectedTopics(new Set());
                      setSelectedGroups(new Set());
                    }}
                    placeholderAll={t("allAreas")}
                  />
                  <FilterChip
                    label={t("filterByTopic")}
                    selectedIds={selectedTopics}
                    options={availableTopics}
                    onToggle={(id) =>
                      setSelectedTopics((prev) => toggleSet(prev, id))
                    }
                    onClear={() => {
                      setSelectedTopics(new Set());
                      setSelectedGroups(new Set());
                    }}
                    placeholderAll={t("allTopics")}
                  />
                  <FilterChip
                    label={t("filterByGroup")}
                    selectedIds={selectedGroups}
                    options={availableGroups}
                    onToggle={(id) =>
                      setSelectedGroups((prev) => toggleSet(prev, id))
                    }
                    onClear={() => setSelectedGroups(new Set())}
                    placeholderAll={t("allGroups")}
                  />
                  {anyFilterActive && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-7 px-2 text-xs text-muted-foreground"
                      onClick={resetAllFilters}
                    >
                      {t("resetFilters")}
                    </Button>
                  )}
                </div>
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={t("searchLessons")}
                    value={search}
                    onValueChange={setSearch}
                    className="h-9"
                  />
                  <CommandList className="max-h-80">
                    <CommandEmpty>{t("noLessonsFound")}</CommandEmpty>
                    {groupedFiltered.map((g) => (
                      <CommandGroup key={g.areaId} heading={g.areaName}>
                        {g.items.map((l) => {
                          const lessonName = pickName(l.translations, locale);
                          const subtitle = topicGroupSubtitle(l);
                          const isSelected = field.value === l.id;
                          return (
                            <CommandItem
                              key={l.id}
                              value={l.id}
                              onSelect={() => {
                                field.onChange(l.id);
                                setOpen(false);
                              }}
                              className="flex items-start gap-2"
                            >
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate">{lessonName}</span>
                                {subtitle && (
                                  <span className="truncate text-[10px] text-muted-foreground">
                                    {subtitle}
                                  </span>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4 shrink-0",
                                  isSelected ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

const toggleSet = (set: Set<string>, id: string): Set<string> => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

interface FilterChipProps {
  label: string;
  selectedIds: Set<string>;
  options: { id: string; name: string }[];
  onToggle: (id: string) => void;
  onClear: () => void;
  placeholderAll: string;
}

function FilterChip({
  label,
  selectedIds,
  options,
  onToggle,
  onClear,
  placeholderAll,
}: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const active = selectedIds.size > 0;

  const displayLabel = (() => {
    if (selectedIds.size === 0) return label;
    if (selectedIds.size === 1) {
      const id = Array.from(selectedIds)[0];
      const name = options.find((o) => o.id === id)?.name;
      return name ? `${label} · ${name}` : `${label} · 1`;
    }
    return `${label} · ${selectedIds.size}`;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant={active ? "secondary" : "outline"}
          className={cn(
            "cursor-pointer select-none h-7 px-2 text-xs flex items-center gap-1 hover:opacity-90",
          )}
        >
          {displayLabel}
          {active ? (
            <button
              type="button"
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              aria-label="clear"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <ChevronDown className="h-3 w-3 opacity-70" />
          )}
        </Badge>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 z-[110] w-[260px]"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={placeholderAll} className="h-9" />
          <CommandList className="max-h-64">
            <CommandEmpty>—</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const isSelected = selectedIds.has(o.id);
                return (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    onSelect={() => onToggle(o.id)}
                  >
                    {o.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
