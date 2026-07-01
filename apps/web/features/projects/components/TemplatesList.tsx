"use client";

import {
  IconArrowLeft,
  IconLayoutGridAdd,
  IconPencil,
  IconPlus,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ROUTES } from "@/constants/routes";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { deleteTemplateAction } from "../actions/manage-templates.action";
import { getTemplateAction } from "../actions/get-template.action";
import { CreateFromTemplateDialog } from "./CreateFromTemplateDialog";
import { TemplateFormDialog } from "./TemplateFormDialog";
import type { ProjectTemplate } from "../types";

type Props = {
  templates: ProjectTemplate[];
  canManage: boolean;
};

export function TemplatesList({ templates, canManage }: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editTemplate, setEditTemplate] =
    React.useState<ProjectTemplate | null>(null);
  const [useOpen, setUseOpen] = React.useState(false);
  const [useTemplateId, setUseTemplateId] = React.useState<string>();

  const openCreate = () => {
    setEditTemplate(null);
    setFormOpen(true);
  };

  const openEdit = async (id: string) => {
    const res = await getTemplateAction(id);
    if (res.success) {
      setEditTemplate(res.data);
      setFormOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
        <Link href={ROUTES.admin.projects(locale)}>
          <IconArrowLeft className="mr-1 h-4 w-4" />
          {t("pageTitle")}
        </Link>
      </Button>
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("templatesTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("templatesSubtitle")}
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <IconPlus className="mr-1 h-4 w-4" />
            {t("newTemplate")}
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noTemplates")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex h-full flex-col justify-between">
              <CardHeader>
                <CardTitle>{tpl.title}</CardTitle>
                {tpl.description && (
                  <CardDescription className="line-clamp-2">
                    {tpl.description}
                  </CardDescription>
                )}
              </CardHeader>
              <div className="flex flex-wrap gap-2 p-4 pt-0">
                <Button
                  size="sm"
                  onClick={() => {
                    setUseTemplateId(tpl.id);
                    setUseOpen(true);
                  }}
                >
                  <IconLayoutGridAdd className="mr-1 h-4 w-4" />
                  {t("useTemplate")}
                </Button>
                {canManage && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(tpl.id)}
                    >
                      <IconPencil className="mr-1 h-4 w-4" />
                      {tc("edit")}
                    </Button>
                    <DeleteConfirmationDialog
                      itemName={tpl.title}
                      onConfirm={async () => {
                        const res = await deleteTemplateAction(tpl.id);
                        if (res.success) {
                          router.refresh();
                          return { success: true };
                        }
                        return { success: false, error: String(res.error) };
                      }}
                      trigger={
                        <Button variant="ghost" size="sm">
                          {tc("delete")}
                        </Button>
                      }
                    />
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {canManage && (
        <TemplateFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          template={editTemplate}
        />
      )}
      <CreateFromTemplateDialog
        open={useOpen}
        onOpenChange={setUseOpen}
        templates={templates}
        presetTemplateId={useTemplateId}
      />
    </div>
  );
}
