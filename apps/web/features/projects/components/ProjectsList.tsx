"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Archive,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ROUTES } from "@/constants/routes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { membershipInitials } from "../lib/membership-name";
import { ProjectFormDialog } from "./ProjectFormDialog";
import type {
  MembershipRef,
  ProjectListItem,
  ProjectStatus,
  ProjectTemplate,
} from "../types";

const VIEW_KEY = "projects:view";

// Status pills from the design handoff: Aktiv=green, Pausiert=amber,
// Abgeschlossen=slate.
const STATUS_VARIANT: Record<ProjectStatus, "green" | "amber" | "slate"> = {
  ACTIVE: "green",
  ON_HOLD: "amber",
  COMPLETED: "slate",
};

const progressPercent = (p: ProjectListItem) =>
  p.taskStats.total > 0
    ? Math.round((p.taskStats.done / p.taskStats.total) * 100)
    : 0;

function MemberAvatars({
  project,
  size = "h-[26px] w-[26px]",
}: {
  project: ProjectListItem;
  size?: string;
}) {
  const members = project.members ?? [];
  const shown = members.slice(0, 4);
  const rest = members.length - shown.length;
  if (members.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      {shown.map((m) => (
        <Avatar key={m.id} className={cn(size, "border border-background")}>
          <AvatarFallback className="text-[10px] font-semibold">
            {membershipInitials(m.membership)}
          </AvatarFallback>
        </Avatar>
      ))}
      {rest > 0 && (
        <Avatar className={cn(size, "border border-background")}>
          <AvatarFallback className="text-[10px] font-semibold">
            +{rest}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

type Props = {
  projects: ProjectListItem[];
  orgMemberships: MembershipRef[];
  templates: ProjectTemplate[];
  canCreate: boolean;
  canManageTemplates: boolean;
};

export function ProjectsList({
  projects,
  orgMemberships,
  templates,
  canCreate,
  canManageTemplates,
}: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [showArchived, setShowArchived] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"active" | "all">(
    "all"
  );
  // Cards/list preference survives reloads via localStorage.
  const [view, setView] = React.useState<"cards" | "list">("cards");
  React.useEffect(() => {
    const v = window.localStorage.getItem(VIEW_KEY);
    if (v === "cards" || v === "list") setView(v);
  }, []);
  React.useEffect(() => {
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  const unarchived = projects.filter((p) => !p.isArchived);
  const activeCount = unarchived.filter((p) => p.status === "ACTIVE").length;
  const onHoldCount = unarchived.filter((p) => p.status === "ON_HOLD").length;
  const completedCount = unarchived.filter(
    (p) => p.status === "COMPLETED"
  ).length;

  const base = projects.filter((p) =>
    showArchived ? p.isArchived : !p.isArchived
  );
  const baseActiveCount = base.filter((p) => p.status === "ACTIVE").length;

  const query = search.trim().toLowerCase();
  const visible = base.filter((p) => {
    if (statusFilter === "active" && p.status !== "ACTIVE") return false;
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      (p.description ?? "").toLowerCase().includes(query)
    );
  });

  const openProject = (id: string) =>
    router.push(ROUTES.admin.projectsBoard(locale, id));

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Page head — title, dynamic counts subtitle, primary action (design). */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("projectCountsSummary", {
              active: activeCount,
              onHold: onHoldCount,
              completed: completedCount,
            })}
          </p>
        </div>
        {canCreate && (
          <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("newProject")}
          </Button>
        )}
      </div>

      {/* Toolbar — search · cards/list toggle · filter chips · ⋯ menu. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchProjectsPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-full pl-9"
          />
        </div>
        <div
          className="flex items-center rounded-md border bg-card p-0.5"
          role="tablist"
          aria-label={t("viewToggle")}
        >
          <Button
            size="sm"
            variant={view === "cards" ? "secondary" : "ghost"}
            className="h-7 gap-1 px-2"
            onClick={() => setView("cards")}
            aria-pressed={view === "cards"}
            title={t("viewCards")}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">{t("viewCards")}</span>
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            className="h-7 gap-1 px-2"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            title={t("viewList")}
          >
            <LayoutList className="h-4 w-4" />
            <span className="hidden sm:inline">{t("viewList")}</span>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {showArchived && (
            <Badge variant="outline" className="gap-1">
              <Archive className="h-3 w-3" />
              {t("archivedProjects")}
            </Badge>
          )}
          <Button
            size="sm"
            variant={statusFilter === "active" ? "secondary" : "outline"}
            className="rounded-full"
            onClick={() => setStatusFilter("active")}
            aria-pressed={statusFilter === "active"}
          >
            {t("status_ACTIVE")}
            <span className="ml-1.5 text-muted-foreground">
              · {baseActiveCount}
            </span>
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "all" ? "secondary" : "outline"}
            className="rounded-full"
            onClick={() => setStatusFilter("all")}
            aria-pressed={statusFilter === "all"}
          >
            {tc("all")}
            <span className="ml-1.5 text-muted-foreground">
              · {base.length}
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                aria-label={t("moreOptions")}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManageTemplates && (
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.admin.projectTemplates(locale)}>
                    {t("manageTemplates")}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuCheckboxItem
                checked={showArchived}
                onCheckedChange={(checked) => setShowArchived(checked === true)}
              >
                {t("archivedProjects")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {base.length === 0
            ? showArchived
              ? t("noArchivedProjects")
              : t("noProjects")
            : t("noResults")}
        </p>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <Link
              key={project.id}
              href={ROUTES.admin.projectsBoard(locale, project.id)}
              className="block"
            >
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      {project.color && (
                        <span
                          className="inline-block h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      {project.title}
                    </CardTitle>
                    <Badge variant={STATUS_VARIANT[project.status]}>
                      {t(`status_${project.status}`)}
                    </Badge>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5">
                  <Progress
                    value={progressPercent(project)}
                    className="h-1.5 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("tasksDoneOfTotal", {
                      done: project.taskStats.done,
                      total: project.taskStats.total,
                    })}
                  </p>
                  <MemberAvatars project={project} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("project")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("progress")}</TableHead>
                <TableHead>{t("colTasks")}</TableHead>
                <TableHead>{t("members")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => openProject(project.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {project.color && (
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <div>
                        <div className="font-semibold">{project.title}</div>
                        {project.description && (
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[project.status]}>
                      {t(`status_${project.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <Progress
                        value={progressPercent(project)}
                        className="h-1.5 w-[90px] bg-muted"
                      />
                      <span className="font-mono text-xs">
                        {progressPercent(project)}%
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {project.taskStats.done} / {project.taskStats.total}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {project.members?.length ?? 0}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {project.dueDate
                      ? format(new Date(project.dueDate), "dd. MMM yyyy", {
                          locale: de,
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        orgMemberships={orgMemberships}
        templates={templates}
      />
    </div>
  );
}
