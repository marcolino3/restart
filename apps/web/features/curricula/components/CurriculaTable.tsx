"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { archiveCurriculumAction } from "../actions/archive-curriculum.action";
import {
  pickTranslation,
  type CurriculumDTO,
  type CurriculumLocale,
} from "../types";

interface Props {
  data: CurriculumDTO[];
}

export function CurriculaTable({ data }: Props) {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const localeUpper = locale.toUpperCase() as CurriculumLocale;

  const columns = useMemo<ColumnDef<CurriculumDTO>[]>(
    () => [
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("slug")} <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: "name",
        accessorFn: (row) =>
          pickTranslation(row.translations, localeUpper)?.name ?? row.slug,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("name")} <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "position",
        header: t("position"),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
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
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={async () => {
                  await handleAction({
                    action: () => archiveCurriculumAction(row.original.id),
                    successMessage: t("curriculumArchived"),
                    errorMessage: t("curriculumArchiveError"),
                    onSuccess: () => router.refresh(),
                  });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tCommon("archive")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t, tCommon, locale, localeUpper, router],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
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
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
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
  );
}
