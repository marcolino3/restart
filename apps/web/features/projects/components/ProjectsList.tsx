"use client";

import { IconArchive, IconPlus } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";

import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ProjectFormDialog } from "./ProjectFormDialog";
import type { MembershipRef, ProjectListItem, ProjectStatus } from "../types";

const STATUS_VARIANT: Record<
  ProjectStatus,
  "default" | "secondary" | "outline"
> = {
  ACTIVE: "default",
  ON_HOLD: "secondary",
  COMPLETED: "outline",
};

type Props = {
  projects: ProjectListItem[];
  orgMemberships: MembershipRef[];
  canCreate: boolean;
};

export function ProjectsList({ projects, orgMemberships, canCreate }: Props) {
  const t = useTranslations("Projects");
  const locale = useLocale();
  const [showArchived, setShowArchived] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const visible = projects.filter((p) =>
    showArchived ? p.isArchived : !p.isArchived
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            <IconArchive className="mr-1 h-4 w-4" />
            {showArchived ? t("showActive") : t("showArchived")}
          </Button>
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <IconPlus className="mr-1 h-4 w-4" />
              {t("newProject")}
            </Button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {showArchived ? t("noArchivedProjects") : t("noProjects")}
        </p>
      ) : (
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
                          className="inline-block h-3 w-3 rounded-full"
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
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        orgMemberships={orgMemberships}
      />
    </div>
  );
}
