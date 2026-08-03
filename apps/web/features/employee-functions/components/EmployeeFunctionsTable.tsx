"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { ArchiveConfirmationDialog } from "@/components/common/ArchiveConfirmationDialog";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { useDataTable } from "@/components/data-table/use-data-table";
import { handleAction } from "@/lib/actions/handle-action";
import { normalizeForSearch } from "@/lib/table/locale-sorting";
import { cn } from "@/lib/utils";

import { archiveEmployeeFunctionAction } from "../actions/archive-employee-function.action";
import { deleteEmployeeFunctionAction } from "../actions/delete-employee-function.action";
import { reorderEmployeeFunctionsAction } from "../actions/reorder-employee-functions.action";
import { EmployeeFunctionDialog } from "./EmployeeFunctionDialog";
import {
  EMPLOYEE_FUNCTION_LOCALES,
  pickEmployeeFunctionName,
  type EmployeeFunctionItem,
} from "../types";

interface Props {
  initialItems: EmployeeFunctionItem[];
}

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; item: EmployeeFunctionItem };

export function EmployeeFunctionsTable({ initialItems }: Props) {
  const t = useTranslations("EmployeeFunctions");
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const archive = async (id: string) => {
    const res = await archiveEmployeeFunctionAction(id);
    if (res.success) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
      return { success: true as const };
    }
    return { success: false as const, error: res.error };
  };

  const remove = async (id: string) => {
    const res = await deleteEmployeeFunctionAction(id);
    if (res.success) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
      return { success: true as const };
    }
    return { success: false as const, error: res.error };
  };

  const columns = useMemo<ColumnDef<EmployeeFunctionItem>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => pickEmployeeFunctionName(row, locale),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("colName")} />
        ),
        meta: { labelKey: "colName" },
        cell: ({ row }) => (
          <span className="font-medium">
            {pickEmployeeFunctionName(row.original, locale)}
          </span>
        ),
      },
      {
        id: "locales",
        header: t("colLocales"),
        enableSorting: false,
        cell: ({ row }) => (
          <LocaleBadges item={row.original} />
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="sr-only">{t("colActions")}</span>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const label = pickEmployeeFunctionName(item, locale);
          return (
            <FunctionRowActions
              item={item}
              label={label}
              onEdit={() => setDialog({ mode: "edit", item })}
              onArchive={() => archive(item.id)}
              onDelete={() => remove(item.id)}
            />
          );
        },
      },
    ],
    [locale, t],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: items,
    columns,
    paginated: false,
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = normalizeForSearch(filterValue);
      if (!needle) return true;
      const names = [
        row.original.name,
        ...row.original.translations.map((tr) => tr.name),
      ];
      return names.some((name) => normalizeForSearch(name).includes(needle));
    },
  });

  const dndEnabled = !globalFilter.trim();
  const visibleRows = table.getRowModel().rows;

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !dndEnabled) return;

    const ids = items.map((item) => item.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const nextIds = arrayMove(ids, oldIndex, newIndex);
    const previous = items;
    setItems((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      return nextIds.map((id, index) => ({
        ...byId.get(id)!,
        sortOrder: index,
      }));
    });

    startTransition(async () => {
      const res = await handleAction({
        action: () => reorderEmployeeFunctionsAction(nextIds),
        successMessage: t("reorderedToast"),
        errorMessage: t("reorderError"),
        onSuccess: () => router.refresh(),
      });
      if (!res.success) setItems(previous);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <DataTable
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          searchPlaceholder={t("searchPlaceholder")}
          showViewOptions={false}
          showPagination={false}
          emptyState={globalFilter.trim() ? t("noResults") : t("empty")}
          toolbar={
            <Button onClick={() => setDialog({ mode: "create" })}>
              <Plus className="mr-1 h-4 w-4" />
              {t("addButton")}
            </Button>
          }
          leadingHeader={<TableHead className="w-8" />}
          bodyWrapper={(rendered) => (
            <SortableContext
              items={visibleRows.map((row) => row.original.id)}
              strategy={verticalListSortingStrategy}
            >
              {rendered}
            </SortableContext>
          )}
          renderRow={(row, cells) => (
            <SortableFunctionRow
              id={row.original.id}
              dragEnabled={dndEnabled}
            >
              {cells}
            </SortableFunctionRow>
          )}
        />
      </DndContext>

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">{t("dragHint")}</p>
      )}

      {dialog && (
        <EmployeeFunctionDialog
          mode={dialog.mode}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          initial={dialog.mode === "edit" ? dialog.item : undefined}
          onSaved={(saved) => {
            setItems((prev) => {
              const idx = prev.findIndex((i) => i.id === saved.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [...prev, saved];
            });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function LocaleBadges({ item }: { item: EmployeeFunctionItem }) {
  const filledLocales = new Set(
    item.translations.filter((tr) => tr.name.trim()).map((tr) => tr.locale),
  );

  return (
    <div className="flex flex-wrap gap-1">
      {EMPLOYEE_FUNCTION_LOCALES.map((loc) => (
        <Badge
          key={loc}
          variant={filledLocales.has(loc) ? "green" : "outline"}
          className={cn(
            "px-1.5 py-0 text-[10px] font-semibold",
            !filledLocales.has(loc) && "text-muted-foreground opacity-60",
          )}
        >
          {loc}
        </Badge>
      ))}
    </div>
  );
}

function FunctionRowActions({
  item,
  label,
  onEdit,
  onArchive,
  onDelete,
}: {
  item: EmployeeFunctionItem;
  label: string;
  onEdit: () => void;
  onArchive: () => Promise<{ success: boolean; error?: unknown }>;
  onDelete: () => Promise<{ success: boolean; error?: unknown }>;
}) {
  const t = useTranslations("EmployeeFunctions");
  const tCommon = useTranslations("Common");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const inUse = item.usageCount > 0;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t("openMenu", { name: label })}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {tCommon("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setArchiveOpen(true);
            }}
          >
            <Archive className="mr-2 h-4 w-4" />
            {tCommon("archive")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {inUse ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem
                    disabled
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {tCommon("delete")}
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                {t("functionInUseTooltip", { count: item.usageCount })}
              </TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon("delete")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ArchiveConfirmationDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={t("archiveTitle", { name: label })}
        description={t("archiveConfirm")}
        onConfirm={onArchive}
      />

      {!inUse && (
        <DeleteConfirmationDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t("deleteTitle", { name: label })}
          description={t("deleteConfirm")}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}

function SortableFunctionRow({
  id,
  dragEnabled,
  children,
}: {
  id: string;
  dragEnabled: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("EmployeeFunctions");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !dragEnabled });

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-50")}
    >
      <TableCell className="w-8" onClick={(e) => e.stopPropagation()}>
        <span
          ref={setActivatorNodeRef}
          {...attributes}
          {...(dragEnabled ? listeners : {})}
          className="inline-flex"
          aria-label={t("dragLabel")}
          title={dragEnabled ? t("dragLabel") : t("dragDisabledWhileSearching")}
        >
          <GripVertical
            className={cn(
              "h-4 w-4 text-muted-foreground",
              dragEnabled
                ? "cursor-grab active:cursor-grabbing"
                : "cursor-not-allowed opacity-30",
            )}
          />
        </span>
      </TableCell>
      {children}
    </TableRow>
  );
}
