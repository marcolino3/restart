"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { ArchiveConfirmationDialog } from "@/components/common/ArchiveConfirmationDialog";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleAction } from "@/lib/actions/handle-action";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { useDataTable } from "@/components/data-table/use-data-table";
import { ROUTES } from "@/constants/routes";
import { useUser } from "@/features/users/context/current-user.context";
import { archiveCurriculumAction } from "../actions/archive-curriculum.action";
import { unarchiveCurriculumAction } from "../actions/unarchive-curriculum.action";
import { hardDeleteCurriculumAction } from "../actions/hard-delete-curriculum.action";
import {
  CURRICULUM_LOCALES,
  pickTranslation,
  type CurriculumDTO,
  type CurriculumLocale,
} from "../types";
import { LocaleBadge } from "./LocaleBadge";

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
          <DataTableColumnHeader column={column} title={t("name")} />
        ),
        meta: { labelKey: "name" },
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{row.original.name}</span>
              {row.original.isArchived && (
                <span className="rounded-full bg-status-slate px-2 py-0.5 text-[10px] font-[650] text-status-slate-foreground">
                  {t("archived")}
                </span>
              )}
            </div>
            <small className="block text-[12px] text-muted-foreground">
              {row.original.slug}
            </small>
          </div>
        ),
      },
      {
        id: "languages",
        enableSorting: false,
        header: () => t("languages"),
        cell: ({ row }) => {
          const present = new Set(
            row.original.translations.map((tr) => tr.locale),
          );
          return (
            <span className="inline-flex gap-1">
              {CURRICULUM_LOCALES.map((loc) => (
                <LocaleBadge key={loc} locale={loc} active={present.has(loc)} />
              ))}
            </span>
          );
        },
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

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: rows,
    columns,
    paginated: false,
  });

  return (
    <>
      <DataTable
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={t("filterCurricula")}
        toolbar={headerActions}
        translateColumn={(key: string) => tCommon(key)}
        showPagination={false}
        emptyState={t("noCurriculaFound")}
      />
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
    </>
  );
}
