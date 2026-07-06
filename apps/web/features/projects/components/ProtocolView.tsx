"use client";

import {
  IconArrowLeft,
  IconCopy,
  IconDots,
  IconFileText,
  IconLayersSubtract,
  IconPencil,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleAction } from "@/lib/actions/handle-action";

import {
  createProtocolAction,
  updateProtocolAction,
} from "../actions/manage-protocols.action";
import { membershipName } from "../lib/membership-name";
import { SaveProtocolTemplateDialog } from "./ManageProtocolTemplatesDialog";
import { ProtocolStatusBadge } from "./ProtocolsList";
import type { Protocol, Task } from "../types";

type Props = {
  protocol: Protocol;
  tasks: Task[];
  /** Whether the viewer would be allowed to edit (creator/participant/admin). */
  canEdit?: boolean;
};

function Section({
  title,
  show,
  children,
}: {
  title: string;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">{children}</CardContent>
    </Card>
  );
}

export function ProtocolView({ protocol, tasks, canEdit = false }: Props) {
  const t = useTranslations("Protocols");
  const tp = useTranslations("Projects");
  const locale = useLocale();
  const router = useRouter();
  const s = protocol.sections;

  const [saveTemplateOpen, setSaveTemplateOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const participantsCount =
    (protocol.participants ?? []).length +
    (protocol.externalParticipants ?? []).length;

  const sublineParts: string[] = [];
  if (protocol.meetingDate) {
    sublineParts.push(
      new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(protocol.meetingDate))
    );
  }
  if (protocol.startTime && protocol.endTime) {
    sublineParts.push(`${protocol.startTime}–${protocol.endTime}`);
  } else if (protocol.startTime) {
    sublineParts.push(protocol.startTime);
  }
  if (participantsCount > 0) {
    sublineParts.push(t("participantsCount", { count: participantsCount }));
  }

  const onDuplicate = async () => {
    setBusy(true);
    const result = await handleAction({
      action: () =>
        createProtocolAction({
          title: `${protocol.title} ${t("copySuffix")}`,
          meetingDate: protocol.meetingDate ?? null,
          startTime: protocol.startTime ?? null,
          endTime: protocol.endTime ?? null,
          status: "DRAFT",
          projectId: protocol.projectId ?? null,
          participantMembershipIds: (protocol.participants ?? []).map(
            (p) => p.membershipId
          ),
          externalParticipants: protocol.externalParticipants ?? [],
          sections: protocol.sections,
        }),
      successMessage: t("protocolDuplicated"),
      errorMessage: t("protocolDuplicateError"),
    });
    setBusy(false);
    if (result.success) {
      router.push(ROUTES.admin.protocolEditor(locale, result.data.id));
    }
  };

  const onBackToDraft = async () => {
    setBusy(true);
    await handleAction({
      action: () =>
        updateProtocolAction({ id: protocol.id, status: "DRAFT" }),
      successMessage: t("backToDraftSuccess"),
      errorMessage: t("backToDraftError"),
    });
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 p-4 print:p-0">
      {/* Header — title + status, subline, actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
            {protocol.title}
            <ProtocolStatusBadge status={protocol.status} />
          </h1>
          {sublineParts.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {sublineParts.join(" · ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.admin.protocols(locale)}>
              <IconArrowLeft className="mr-1 h-4 w-4" />
              {t("allProtocols")}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            {t("exportPdf")}
          </Button>
          {canEdit && (
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
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onClick={() => setSaveTemplateOpen(true)}>
                  <IconLayersSubtract className="mr-2 h-4 w-4" />
                  {t("saveAsTemplate")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate} disabled={busy}>
                  <IconCopy className="mr-2 h-4 w-4" />
                  {t("duplicate")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onBackToDraft} disabled={busy}>
                  <IconPencil className="mr-2 h-4 w-4" />
                  {t("backToDraft")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {(protocol.project ||
        (protocol.participants ?? []).length > 0 ||
        protocol.externalParticipants.length > 0) && (
        <Card>
          <CardContent className="space-y-1 pt-6 text-sm text-muted-foreground">
            {protocol.project && (
              <div>
                {t("project")}: {protocol.project.title}
              </div>
            )}
            {(protocol.participants ?? []).length > 0 && (
              <div>
                {t("participants")}:{" "}
                {(protocol.participants ?? [])
                  .map((p) => membershipName(p.membership))
                  .join(", ")}
              </div>
            )}
            {protocol.externalParticipants.length > 0 && (
              <div>
                {t("externalParticipants")}:{" "}
                {protocol.externalParticipants.join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Section title={t("agenda")} show={s.agendaItems.length > 0}>
        {s.agendaItems.map((a, i) => (
          <div key={i}>
            {a.no != null ? `${a.no}. ` : ""}
            {a.topic}
            {a.goal ? ` — ${t(`goal_${a.goal}`)}` : ""}
          </div>
        ))}
      </Section>

      <Section title={t("decisions")} show={s.decisions.length > 0}>
        {s.decisions.map((d, i) => (
          <div key={i}>
            <span className="font-medium">{d.topic}</span>
            {d.decision ? `: ${d.decision}` : ""}
            {d.responsible ? ` (${d.responsible}` : ""}
            {d.responsible && d.dueDate ? `, ${d.dueDate})` : d.responsible ? ")" : ""}
          </div>
        ))}
      </Section>

      <Section title={t("todos")} show={tasks.length > 0}>
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              <IconFileText className="h-3 w-3 text-muted-foreground" />
              {task.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {(task.assignees ?? [])
                .map((a) => membershipName(a.membership))
                .join(", ") || t("unassigned")}{" "}
              · {tp(`taskStatus_${task.status}`)}
            </span>
          </div>
        ))}
      </Section>

      <Section title={t("communications")} show={s.communications.length > 0}>
        {s.communications.map((c, i) => (
          <div key={i}>
            <span className="font-medium">{c.topic}</span>
            {c.audience ? ` → ${c.audience}` : ""}
            {c.channel ? ` (${c.channel})` : ""}
            {c.dueDate ? ` — ${c.dueDate}` : ""}
          </div>
        ))}
      </Section>

      <Section title={t("infoPoints")} show={s.infoPoints.length > 0}>
        <ul className="list-disc pl-5">
          {s.infoPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("challenges")} show={s.challenges.length > 0}>
        {s.challenges.map((c, i) => (
          <div key={i}>
            <span className="font-medium">{c.topic}</span>
            {c.challenge ? `: ${c.challenge}` : ""}
            {c.supportNeeded ? ` — ${c.supportNeeded}` : ""}
          </div>
        ))}
      </Section>

      <Section title={t("openPoints")} show={s.openPoints.length > 0}>
        {s.openPoints.map((o, i) => (
          <div key={i}>
            <span className="font-medium">{o.topic}</span>
            {o.nextStep ? `: ${o.nextStep}` : ""}
            {o.forNextMeeting ? ` · ${t("forNextMeeting")}` : ""}
          </div>
        ))}
      </Section>

      {canEdit && (
        <SaveProtocolTemplateDialog
          open={saveTemplateOpen}
          onOpenChange={setSaveTemplateOpen}
          protocolId={protocol.id}
          defaultTitle={protocol.title}
        />
      )}
    </div>
  );
}
