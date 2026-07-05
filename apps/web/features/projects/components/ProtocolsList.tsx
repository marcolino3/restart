"use client";

import {
  IconDots,
  IconLayersSubtract,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { deleteProtocolAction } from "../actions/manage-protocols.action";
import type { ProtocolListRow } from "../actions/get-protocols.action";
import { CreateProtocolDialog } from "./CreateProtocolDialog";
import { ManageProtocolTemplatesDialog } from "./ManageProtocolTemplatesDialog";
import type { ProjectListItem, ProtocolStatus, ProtocolTemplate } from "../types";

type StatusFilter = "ALL" | ProtocolStatus;

type Props = {
  protocols: ProtocolListRow[];
  projects: ProjectListItem[];
  templates: ProtocolTemplate[];
  canWrite: boolean;
  canDelete: boolean;
  canManage: boolean;
};

const FILTERS: { key: StatusFilter; labelKey: string }[] = [
  { key: "ALL", labelKey: "filterAll" },
  { key: "DRAFT", labelKey: "filterDrafts" },
  { key: "FINALIZED", labelKey: "filterFinalized" },
];

export function ProtocolStatusBadge({ status }: { status: ProtocolStatus }) {
  const t = useTranslations("Protocols");
  return status === "FINALIZED" ? (
    <Badge
      variant="outline"
      className="border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
    >
      {t("status_FINALIZED")}
    </Badge>
  ) : (
    <Badge variant="secondary">{t("status_DRAFT")}</Badge>
  );
}

export function ProtocolsList({
  protocols,
  projects,
  templates,
  canWrite,
  canDelete,
  canManage,
}: Props) {
  const t = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [templatesOpen, setTemplatesOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [locale]
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return protocols.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.project?.title ?? "").toLowerCase().includes(q)
      );
    });
  }, [protocols, search, statusFilter]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("meetingsCount", { count: protocols.length })}
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-1 h-4 w-4" />
            {t("newProtocol")}
          </Button>
        )}
      </div>

      {/* Toolbar — search · status chips · ⋯ menu */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[260px]">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchProtocolPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-full pl-9"
          />
        </div>
        {FILTERS.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            aria-pressed={statusFilter === key}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-4 text-[13px] font-medium transition",
              statusFilter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {t(labelKey)}
          </button>
        ))}
        <span className="flex-1" />
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full"
                aria-label={t("moreSettings")}
              >
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => setTemplatesOpen(true)}>
                <IconLayersSubtract className="mr-2 h-4 w-4" />
                {t("manageTemplates")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      {protocols.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noProtocols")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("colMeeting")}</TableHead>
                <TableHead>{t("project")}</TableHead>
                <TableHead>{t("colParticipants")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                {canDelete && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((protocol) => (
                <TableRow
                  key={protocol.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(ROUTES.admin.protocolEditor(locale, protocol.id))
                  }
                >
                  <TableCell className="font-semibold">
                    {protocol.title}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {protocol.meetingDate ? (
                      dateFormatter.format(new Date(protocol.meetingDate))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {protocol.project?.title ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {(protocol.participants ?? []).length}
                  </TableCell>
                  <TableCell>
                    <ProtocolStatusBadge status={protocol.status} />
                  </TableCell>
                  {canDelete && (
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteConfirmationDialog
                        itemName={protocol.title}
                        onConfirm={async () => {
                          const res = await deleteProtocolAction(protocol.id);
                          if (res.success) {
                            router.refresh();
                            return { success: true };
                          }
                          return { success: false, error: String(res.error) };
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label={tc("delete")}
                            title={tc("delete")}
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("autoTasksHint")}</p>

      <CreateProtocolDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects}
        templates={templates}
      />
      {canManage && (
        <ManageProtocolTemplatesDialog
          open={templatesOpen}
          onOpenChange={setTemplatesOpen}
          templates={templates}
        />
      )}
    </div>
  );
}
