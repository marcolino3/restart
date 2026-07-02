"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { IconArrowLeft, IconFileText } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { membershipName } from "../lib/membership-name";
import type { Protocol, Task } from "../types";

type Props = { protocol: Protocol; tasks: Task[] };

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

export function ProtocolView({ protocol, tasks }: Props) {
  const t = useTranslations("Protocols");
  const tp = useTranslations("Projects");
  const locale = useLocale();
  const s = protocol.sections;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href={ROUTES.admin.protocols(locale)}>
          <IconArrowLeft className="mr-1 h-4 w-4" />
          {t("pageTitle")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {protocol.title}
            <Badge
              variant={
                protocol.status === "FINALIZED" ? "outline" : "secondary"
              }
            >
              {t(`status_${protocol.status}`)}
            </Badge>
            {protocol.project && (
              <Badge variant="outline">{protocol.project.title}</Badge>
            )}
            <Badge variant="secondary" className="ml-auto">
              {t("readOnly")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {protocol.meetingDate && (
            <div>
              {t("meetingDate")}:{" "}
              {format(new Date(protocol.meetingDate), "dd. MMMM yyyy", {
                locale: de,
              })}
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
    </div>
  );
}
