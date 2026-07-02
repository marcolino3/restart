"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { IconCalendar, IconPlus } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

import { deleteProtocolAction } from "../actions/manage-protocols.action";
import { CreateProtocolDialog } from "./CreateProtocolDialog";
import type { ProjectListItem, ProtocolListItem } from "../types";

type Props = {
  protocols: ProtocolListItem[];
  projects: ProjectListItem[];
  canWrite: boolean;
  canDelete: boolean;
};

export function ProtocolsList({
  protocols,
  projects,
  canWrite,
  canDelete,
}: Props) {
  const t = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-1 h-4 w-4" />
            {t("newProtocol")}
          </Button>
        )}
      </div>

      {protocols.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noProtocols")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {protocols.map((protocol) => (
            <Card key={protocol.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={ROUTES.admin.protocolEditor(locale, protocol.id)}
                    className="min-w-0 flex-1"
                  >
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      {protocol.title}
                      <Badge
                        variant={
                          protocol.status === "FINALIZED"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {t(`status_${protocol.status}`)}
                      </Badge>
                      {protocol.project && (
                        <Badge variant="outline">{protocol.project.title}</Badge>
                      )}
                    </CardTitle>
                    {protocol.meetingDate && (
                      <span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <IconCalendar className="h-3.5 w-3.5" />
                        {format(new Date(protocol.meetingDate), "dd. MMMM yyyy", {
                          locale: de,
                        })}
                      </span>
                    )}
                  </Link>
                  {canDelete && (
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
                        <Button variant="ghost" size="sm">
                          {tc("delete")}
                        </Button>
                      }
                    />
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <CreateProtocolDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects}
      />
    </div>
  );
}
