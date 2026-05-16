"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Archive,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { ArchiveConfirmationDialog } from "@/components/common/ArchiveConfirmationDialog";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";
import { useUser } from "@/features/users/context/current-user.context";
import { archiveCurriculumAction } from "../actions/archive-curriculum.action";
import { unarchiveCurriculumAction } from "../actions/unarchive-curriculum.action";
import { hardDeleteCurriculumAction } from "../actions/hard-delete-curriculum.action";
import {
  pickTranslation,
  type CurriculumDTO,
  type CurriculumLocale,
} from "../types";

interface Props {
  data: CurriculumDTO[];
  headerActions?: React.ReactNode;
}

type CurriculumRow = CurriculumDTO & { name: string };

export function CurriculaTable({ data, headerActions }: Props) {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const currentUser = useUser();
  const isSuperAdmin = currentUser?.isSuperAdmin ?? false;

  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  const rows = useMemo<CurriculumRow[]>(
    () =>
      data.map((c) => ({
        ...c,
        name: pickTranslation(c.translations, localeUpper)?.name ?? c.slug,
      })),
    [data, localeUpper],
  );

  const columns = useMemo<ColumnDef<CurriculumRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("name")} <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.name}</span>
            {row.original.isArchived && (
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {t("archived")}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">{tCommon("openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={ROUTES.admin.curriculaEdit(locale, row.original.id)}
                  className="flex gap-2"
                >
                  <Pencil className="h-4 w-4" /> {tCommon("edit")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.isArchived ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleAction({
                      action: () =>
                        unarchiveCurriculumAction(row.original.id),
                      successMessage: t("curriculumRestored"),
                      errorMessage: t("curriculumRestoreError"),
                      onSuccess: () => router.refresh(),
                    });
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t("restoreCurriculum")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArchiveTarget({
                      id: row.original.id,
                      name: row.original.name,
                    });
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {tCommon("archive")}
                </DropdownMenuItem>
              )}
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHardDeleteTarget({
                        id: row.original.id,
                        name: row.original.name,
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("hardDeleteCurriculum")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t, tCommon, locale, router, isSuperAdmin],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const filter = String(filterValue).toLowerCase().trim();
      if (!filter) return true;
      return (
        row.original.slug.toLowerCase().includes(filter) ||
        row.original.name.toLowerCase().includes(filter)
      );
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder={t("filterCurricula")}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        {headerActions && <div className="ml-auto">{headerActions}</div>}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
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
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      ROUTES.admin.curriculaEdit(locale, row.original.id),
                    )
                  }
                  data-archived={row.original.isArchived || undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        row.original.isArchived
                          ? "text-muted-foreground"
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("noCurriculaFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {archiveTarget && (
        <ArchiveConfirmationDialog
          open={true}
          onOpenChange={(o) => !o && setArchiveTarget(null)}
          title={t("archiveCurriculumTitle")}
          description={t("archiveCurriculumDescription")}
          onConfirm={async () => {
            const res = await archiveCurriculumAction(archiveTarget.id);
            if (res.success) router.refresh();
            return { success: res.success };
          }}
          onSuccess={() => setArchiveTarget(null)}
        />
      )}
      {hardDeleteTarget && (
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={(o) => !o && setHardDeleteTarget(null)}
          title={t("hardDeleteCurriculumTitle")}
          description={t("hardDeleteCurriculumDescription", {
            name: hardDeleteTarget.name,
          })}
          onConfirm={async () => {
            const res = await hardDeleteCurriculumAction(hardDeleteTarget.id);
            if (res.success) router.refresh();
            return res;
          }}
          onSuccess={() => setHardDeleteTarget(null)}
        />
      )}
    </div>
  );
}
