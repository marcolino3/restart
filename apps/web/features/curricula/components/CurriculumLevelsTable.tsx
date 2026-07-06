"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  type ColumnDef,
  type ExpandedState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurriculumNodesAction } from "../actions/get-curriculum-nodes.action";
import {
  pickTranslation,
  type CurriculumLevelDTO,
  type CurriculumLocale,
  type CurriculumNodeDTO,
} from "../types";
import { CurriculumLevelTree } from "./CurriculumLevelTree";
import { CurriculumLevelTranslationsDialog } from "./CurriculumLevelTranslationsDialog";

interface Props {
  curriculumId: string;
  levels: CurriculumLevelDTO[];
  initialNodesByLevel?: Map<string, CurriculumNodeDTO[]>;
  includeArchived?: boolean;
  allLessons?: import("@/features/record-keeping/types").LessonOption[];
}

type LevelRow = CurriculumLevelDTO & { name: string };

function nodeListsStructurallyEqual(
  a: CurriculumNodeDTO[],
  b: CurriculumNodeDTO[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.parentId !== y.parentId ||
      x.position !== y.position ||
      x.isArchived !== y.isArchived ||
      x.lessonType !== y.lessonType ||
      x.lessonScale !== y.lessonScale ||
      x.nodeType !== y.nodeType
    ) {
      return false;
    }
  }
  return true;
}

export function CurriculumLevelsTable({
  curriculumId,
  levels,
  initialNodesByLevel,
  includeArchived = false,
  allLessons,
}: Props) {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "position", desc: false },
  ]);
  const [editingLevel, setEditingLevel] = useState<CurriculumLevelDTO | null>(
    null,
  );
  const [nodesByLevel, setNodesByLevel] = useState<
    Map<string, CurriculumNodeDTO[]>
  >(initialNodesByLevel ?? new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [treeExpandSignal, setTreeExpandSignal] = useState(0);
  const [treeCollapseSignal, setTreeCollapseSignal] = useState(0);

  // Only swap when the server data actually changed structurally. Locale
  // switches / router.refresh re-emit fresh Map refs but the underlying
  // node lists are identical — replacing them would tear down the child
  // CurriculumLevelTree's @dnd-kit sortable items and kill drag.
  useEffect(() => {
    if (!initialNodesByLevel) return;
    setNodesByLevel((prev) => {
      if (prev.size !== initialNodesByLevel.size) return initialNodesByLevel;
      for (const [levelId, nextNodes] of initialNodesByLevel) {
        const prevNodes = prev.get(levelId);
        if (!prevNodes || !nodeListsStructurallyEqual(prevNodes, nextNodes)) {
          return initialNodesByLevel;
        }
      }
      return prev;
    });
  }, [initialNodesByLevel]);

  const data = useMemo<LevelRow[]>(
    () =>
      levels.map((l) => ({
        ...l,
        name: pickTranslation(l.translations, localeUpper)?.name ?? l.slug,
      })),
    [levels, localeUpper],
  );

  const fetchNodesIfNeeded = async (levelId: string) => {
    if (nodesByLevel.has(levelId)) return;
    if (loading.has(levelId)) return;
    setLoading((prev) => new Set(prev).add(levelId));
    const res = await getCurriculumNodesAction(
      curriculumId,
      levelId,
      includeArchived,
    );
    setNodesByLevel((prev) => {
      const next = new Map(prev);
      next.set(levelId, res.success && res.data ? res.data : []);
      return next;
    });
    setLoading((prev) => {
      const next = new Set(prev);
      next.delete(levelId);
      return next;
    });
  };

  // Invalidate cache when the archived-toggle changes so we re-fetch with the new flag.
  useEffect(() => {
    setNodesByLevel(initialNodesByLevel ?? new Map());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]);

  // When filter is active, pre-fetch nodes for all levels so deep matches are findable.
  useEffect(() => {
    if (!globalFilter.trim()) return;
    for (const level of data) {
      if (!nodesByLevel.has(level.id) && !loading.has(level.id)) {
        void fetchNodesIfNeeded(level.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, data]);

  const filterLc = globalFilter.toLowerCase().trim();

  const nodeMatchesByLevel = useMemo(() => {
    const result = new Map<string, boolean>();
    if (!filterLc) return result;
    for (const [levelId, nodes] of nodesByLevel.entries()) {
      const has = nodes.some((n) => {
        const name = pickTranslation(n.translations, localeUpper)?.name ?? "";
        return name.toLowerCase().includes(filterLc);
      });
      result.set(levelId, has);
    }
    return result;
  }, [filterLc, nodesByLevel, localeUpper]);

  // Auto-expand level rows where the filter matches a child node.
  useEffect(() => {
    if (!filterLc) return;
    setExpanded((prev) => {
      const prevObj = typeof prev === "boolean" ? {} : prev;
      const next: Record<string, boolean> = { ...prevObj };
      for (const [levelId, has] of nodeMatchesByLevel.entries()) {
        if (has) next[levelId] = true;
      }
      return next;
    });
  }, [filterLc, nodeMatchesByLevel]);

  const columns = useMemo<ColumnDef<LevelRow>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              const wasExpanded = row.getIsExpanded();
              row.toggleExpanded();
              if (!wasExpanded) void fetchNodesIfNeeded(row.original.id);
            }}
            aria-label={
              row.getIsExpanded() ? tCommon("collapse") : tCommon("expand")
            }
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ),
      },
      { accessorKey: "name", header: t("name") },
      { accessorKey: "position", header: t("position") },
      {
        id: "actions",
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              setEditingLevel(row.original);
            }}
            aria-label={t("editLevelTranslations")}
            title={t("editLevelTranslations")}
          >
            <Languages className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tCommon, nodesByLevel, loading],
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    state: { expanded, sorting, globalFilter },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const filter = String(filterValue).toLowerCase().trim();
      if (!filter) return true;
      if (
        row.original.slug.toLowerCase().includes(filter) ||
        row.original.name.toLowerCase().includes(filter)
      ) {
        return true;
      }
      return nodeMatchesByLevel.get(row.original.id) === true;
    },
  });

  const allExpanded = table.getIsAllRowsExpanded();

  const expandAll = async () => {
    const nextOpen = !allExpanded;
    if (nextOpen) {
      await Promise.all(
        table.getRowModel().rows.map((r) => fetchNodesIfNeeded(r.original.id)),
      );
      table.toggleAllRowsExpanded(true);
      setTreeExpandSignal((v) => v + 1);
    } else {
      table.toggleAllRowsExpanded(false);
      setTreeCollapseSignal((v) => v + 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder={t("filterLevels")}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={expandAll}>
          {allExpanded ? (
            <>
              <ChevronsDownUp className="h-4 w-4 mr-2" />
              {t("collapseAll")}
            </>
          ) : (
            <>
              <ChevronsUpDown className="h-4 w-4 mr-2" />
              {t("expandAll")}
            </>
          )}
        </Button>
      </div>
      <div className="overflow-hidden rounded-card border bg-card shadow-xs">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={h.id === "expander" ? "w-10" : undefined}
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => {
                      const wasExpanded = row.getIsExpanded();
                      row.toggleExpanded();
                      if (!wasExpanded) void fetchNodesIfNeeded(row.original.id);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={columns.length} className="p-4">
                        {loading.has(row.original.id) ? (
                          <p className="text-sm text-muted-foreground">
                            {tCommon("loading")}
                          </p>
                        ) : (
                          <CurriculumLevelTree
                            curriculumId={curriculumId}
                            levelId={row.original.id}
                            initialNodes={nodesByLevel.get(row.original.id) ?? []}
                            expandSignal={treeExpandSignal}
                            collapseSignal={treeCollapseSignal}
                            externalFilter={filterLc ? globalFilter : undefined}
                            hideToolbar={!!filterLc}
                            allLessons={allLessons}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("noLevelsYet")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {editingLevel && (
        <CurriculumLevelTranslationsDialog
          open={true}
          onOpenChange={(o) => !o && setEditingLevel(null)}
          level={editingLevel}
          curriculumId={curriculumId}
        />
      )}
    </div>
  );
}
