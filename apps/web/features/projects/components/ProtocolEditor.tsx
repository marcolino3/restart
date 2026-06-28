"use client";

import { IconArrowLeft, IconPlus, IconTrash } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";

import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { fromIsoDate, toIsoDate } from "@/components/form/DatePicker";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleAction } from "@/lib/actions/handle-action";
import { cn } from "@/lib/utils";

import { updateProtocolAction } from "../actions/manage-protocols.action";
import { membershipName } from "../lib/membership-name";
import { ProtocolTodosPanel } from "./ProtocolTodosPanel";
import {
  AGENDA_GOALS,
  type MembershipRef,
  type ProjectListItem,
  type Protocol,
  type Task,
} from "../types";

const NO_PROJECT = "__none__";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm";

type EditorForm = {
  title: string;
  meetingDate: Date | null;
  status: "DRAFT" | "FINALIZED";
  projectId: string;
  participantMembershipIds: string[];
  externalParticipants: string;
  agendaItems: { no: string; topic: string; goal: string }[];
  decisions: {
    topic: string;
    decision: string;
    responsible: string;
    dueDate: string;
  }[];
  communications: {
    topic: string;
    audience: string;
    responsible: string;
    channel: string;
    dueDate: string;
  }[];
  infoPoints: { value: string }[];
  challenges: { topic: string; challenge: string; supportNeeded: string }[];
  openPoints: { topic: string; nextStep: string; forNextMeeting: boolean }[];
};

type Props = {
  protocol: Protocol;
  orgMemberships: MembershipRef[];
  projects: ProjectListItem[];
  existingTasks: Task[];
  canWrite: boolean;
};

export function ProtocolEditor({
  protocol,
  orgMemberships,
  projects,
  existingTasks,
  canWrite,
}: Props) {
  const t = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const memberOptions = orgMemberships.map((m) => ({
    value: m.id,
    label: membershipName(m),
  }));

  const form = useForm<EditorForm>({
    defaultValues: {
      title: protocol.title,
      meetingDate: fromIsoDate(protocol.meetingDate),
      status: protocol.status,
      projectId: protocol.projectId ?? NO_PROJECT,
      participantMembershipIds: (protocol.participants ?? []).map(
        (p) => p.membershipId
      ),
      externalParticipants: (protocol.externalParticipants ?? []).join("\n"),
      agendaItems: protocol.sections.agendaItems.map((a) => ({
        no: a.no != null ? String(a.no) : "",
        topic: a.topic,
        goal: a.goal ?? "",
      })),
      decisions: protocol.sections.decisions.map((d) => ({
        topic: d.topic,
        decision: d.decision ?? "",
        responsible: d.responsible ?? "",
        dueDate: d.dueDate ?? "",
      })),
      communications: protocol.sections.communications.map((c) => ({
        topic: c.topic,
        audience: c.audience ?? "",
        responsible: c.responsible ?? "",
        channel: c.channel ?? "",
        dueDate: c.dueDate ?? "",
      })),
      infoPoints: protocol.sections.infoPoints.map((value) => ({ value })),
      challenges: protocol.sections.challenges.map((c) => ({
        topic: c.topic,
        challenge: c.challenge ?? "",
        supportNeeded: c.supportNeeded ?? "",
      })),
      openPoints: protocol.sections.openPoints.map((o) => ({
        topic: o.topic,
        nextStep: o.nextStep ?? "",
        forNextMeeting: o.forNextMeeting,
      })),
    },
  });

  const agenda = useFieldArray({ control: form.control, name: "agendaItems" });
  const decisions = useFieldArray({ control: form.control, name: "decisions" });
  const comms = useFieldArray({ control: form.control, name: "communications" });
  const infos = useFieldArray({ control: form.control, name: "infoPoints" });
  const challenges = useFieldArray({
    control: form.control,
    name: "challenges",
  });
  const openPoints = useFieldArray({
    control: form.control,
    name: "openPoints",
  });

  // Todos can only be assigned to people who attend the meeting.
  const selectedParticipantIds = form.watch("participantMembershipIds") ?? [];

  const onSubmit = async (values: EditorForm) => {
    const clean = (s: string) => {
      const v = s.trim();
      return v === "" ? null : v;
    };
    const sections = {
      agendaItems: values.agendaItems
        .filter((a) => a.topic.trim())
        .map((a) => ({
          no: a.no.trim() ? Number(a.no) : null,
          topic: a.topic.trim(),
          goal: a.goal ? (a.goal as EditorForm["status"]) : null,
        })),
      decisions: values.decisions
        .filter((d) => d.topic.trim())
        .map((d) => ({
          topic: d.topic.trim(),
          decision: clean(d.decision),
          responsible: clean(d.responsible),
          dueDate: clean(d.dueDate),
        })),
      communications: values.communications
        .filter((c) => c.topic.trim())
        .map((c) => ({
          topic: c.topic.trim(),
          audience: clean(c.audience),
          responsible: clean(c.responsible),
          channel: clean(c.channel),
          dueDate: clean(c.dueDate),
        })),
      infoPoints: values.infoPoints
        .map((i) => i.value.trim())
        .filter((v) => v !== ""),
      challenges: values.challenges
        .filter((c) => c.topic.trim())
        .map((c) => ({
          topic: c.topic.trim(),
          challenge: clean(c.challenge),
          supportNeeded: clean(c.supportNeeded),
        })),
      openPoints: values.openPoints
        .filter((o) => o.topic.trim())
        .map((o) => ({
          topic: o.topic.trim(),
          nextStep: clean(o.nextStep),
          forNextMeeting: !!o.forNextMeeting,
        })),
    };

    await handleAction({
      action: () =>
        updateProtocolAction({
          id: protocol.id,
          title: values.title.trim(),
          meetingDate: toIsoDate(values.meetingDate),
          status: values.status,
          projectId:
            values.projectId === NO_PROJECT ? null : values.projectId,
          externalParticipants: values.externalParticipants
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s !== ""),
          participantMembershipIds: values.participantMembershipIds,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sections: sections as any,
        }),
      successMessage: t("protocolSaved"),
      errorMessage: t("protocolSaveError"),
    });
    router.refresh();
  };

  const addBtn = (label: string, onClick: () => void) =>
    canWrite ? (
      <Button type="button" variant="outline" size="sm" onClick={onClick}>
        <IconPlus className="mr-1 h-4 w-4" />
        {label}
      </Button>
    ) : null;

  const removeBtn = (onClick: () => void) =>
    canWrite ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mt-1 h-8 w-8 shrink-0 text-destructive"
        onClick={onClick}
      >
        <IconTrash className="h-4 w-4" />
      </Button>
    ) : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href={ROUTES.admin.protocols(locale)}>
          <IconArrowLeft className="mr-1 h-4 w-4" />
          {t("pageTitle")}
        </Link>
      </Button>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("title")}</Label>
                <Input {...form.register("title")} />
              </div>
              <DatePickerFormField
                name="meetingDate"
                label="meetingDate"
                namespace="Protocols"
                disabledDate={(d) => d < new Date("1900-01-01")}
              />
              <div className="space-y-1">
                <Label>{t("status")}</Label>
                <select className={selectClass} {...form.register("status")}>
                  <option value="DRAFT">{t("status_DRAFT")}</option>
                  <option value="FINALIZED">{t("status_FINALIZED")}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t("project")}</Label>
                <select className={selectClass} {...form.register("projectId")}>
                  <option value={NO_PROJECT}>{t("noProject")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <ComboboxFormField
                name="participantMembershipIds"
                label="participants"
                namespace="Protocols"
                multiple
                translateOptions={false}
                options={memberOptions}
              />
              <div className="space-y-1">
                <Label>{t("externalParticipants")}</Label>
                <Textarea
                  rows={3}
                  placeholder={t("externalParticipantsHint")}
                  {...form.register("externalParticipants")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Traktanden */}
          <Section
            title={t("agenda")}
            action={addBtn(t("addRow"), () =>
              agenda.append({ no: "", topic: "", goal: "" })
            )}
          >
            {agenda.fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2">
                <Input
                  className="w-16"
                  placeholder={t("agendaNo")}
                  {...form.register(`agendaItems.${i}.no`)}
                />
                <Input
                  className="flex-1"
                  placeholder={t("agendaTopic")}
                  {...form.register(`agendaItems.${i}.topic`)}
                />
                <select
                  className={cn(selectClass, "w-48")}
                  {...form.register(`agendaItems.${i}.goal`)}
                >
                  <option value="">—</option>
                  {AGENDA_GOALS.map((g) => (
                    <option key={g} value={g}>
                      {t(`goal_${g}`)}
                    </option>
                  ))}
                </select>
                {removeBtn(() => agenda.remove(i))}
              </div>
            ))}
          </Section>

          {/* Entscheidungen */}
          <Section
            title={t("decisions")}
            action={addBtn(t("addRow"), () =>
              decisions.append({
                topic: "",
                decision: "",
                responsible: "",
                dueDate: "",
              })
            )}
          >
            {decisions.fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2">
                <Input
                  className="flex-1"
                  placeholder={t("colTopic")}
                  {...form.register(`decisions.${i}.topic`)}
                />
                <Input
                  className="flex-1"
                  placeholder={t("colDecision")}
                  {...form.register(`decisions.${i}.decision`)}
                />
                <Input
                  className="w-40"
                  placeholder={t("colResponsible")}
                  {...form.register(`decisions.${i}.responsible`)}
                />
                <Input
                  className="w-40"
                  placeholder={t("colDeadline")}
                  {...form.register(`decisions.${i}.dueDate`)}
                />
                {removeBtn(() => decisions.remove(i))}
              </div>
            ))}
          </Section>

          {/* Todos / Massnahmen → Tasks */}
          <ProtocolTodosPanel
            protocolId={protocol.id}
            memberOptions={memberOptions.filter((o) =>
              selectedParticipantIds.includes(o.value)
            )}
            existingTasks={existingTasks}
            canWrite={canWrite}
          />

          {/* Kommunikation */}
          <Section
            title={t("communications")}
            action={addBtn(t("addRow"), () =>
              comms.append({
                topic: "",
                audience: "",
                responsible: "",
                channel: "",
                dueDate: "",
              })
            )}
          >
            {comms.fields.map((field, i) => (
              <div key={field.id} className="flex flex-wrap items-start gap-2">
                <Input
                  className="min-w-40 flex-1"
                  placeholder={t("colTopic")}
                  {...form.register(`communications.${i}.topic`)}
                />
                <Input
                  className="w-40"
                  placeholder={t("colAudience")}
                  {...form.register(`communications.${i}.audience`)}
                />
                <Input
                  className="w-40"
                  placeholder={t("colResponsible")}
                  {...form.register(`communications.${i}.responsible`)}
                />
                <Input
                  className="w-40"
                  placeholder={t("colChannel")}
                  {...form.register(`communications.${i}.channel`)}
                />
                <Input
                  className="w-32"
                  placeholder={t("colDeadline")}
                  {...form.register(`communications.${i}.dueDate`)}
                />
                {removeBtn(() => comms.remove(i))}
              </div>
            ))}
          </Section>

          {/* Informationspunkte */}
          <Section
            title={t("infoPoints")}
            action={addBtn(t("addRow"), () => infos.append({ value: "" }))}
          >
            {infos.fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2">
                <Input
                  className="flex-1"
                  {...form.register(`infoPoints.${i}.value`)}
                />
                {removeBtn(() => infos.remove(i))}
              </div>
            ))}
          </Section>

          {/* Herausforderungen */}
          <Section
            title={t("challenges")}
            action={addBtn(t("addRow"), () =>
              challenges.append({ topic: "", challenge: "", supportNeeded: "" })
            )}
          >
            {challenges.fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2">
                <Input
                  className="flex-1"
                  placeholder={t("colTopic")}
                  {...form.register(`challenges.${i}.topic`)}
                />
                <Input
                  className="flex-1"
                  placeholder={t("colChallenge")}
                  {...form.register(`challenges.${i}.challenge`)}
                />
                <Input
                  className="flex-1"
                  placeholder={t("colSupport")}
                  {...form.register(`challenges.${i}.supportNeeded`)}
                />
                {removeBtn(() => challenges.remove(i))}
              </div>
            ))}
          </Section>

          {/* Offene Punkte */}
          <Section
            title={t("openPoints")}
            action={addBtn(t("addRow"), () =>
              openPoints.append({
                topic: "",
                nextStep: "",
                forNextMeeting: false,
              })
            )}
          >
            {openPoints.fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder={t("colTopic")}
                  {...form.register(`openPoints.${i}.topic`)}
                />
                <Input
                  className="flex-1"
                  placeholder={t("colNextStep")}
                  {...form.register(`openPoints.${i}.nextStep`)}
                />
                <label className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ForNextMeetingCheckbox index={i} />
                  {t("forNextMeeting")}
                </label>
                {removeBtn(() => openPoints.remove(i))}
              </div>
            ))}
          </Section>

          {canWrite && (
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {tc("save")}
              </Button>
            </div>
          )}
        </form>
      </FormProvider>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

// A tiny controlled checkbox bound to RHF (used for openPoints.forNextMeeting).
function ForNextMeetingCheckbox({ index }: { index: number }) {
  const { watch, setValue } = useFormContext<EditorForm>();
  const name = `openPoints.${index}.forNextMeeting` as const;
  const value = watch(name);
  return (
    <Checkbox
      checked={!!value}
      onCheckedChange={(c) => setValue(name, !!c)}
    />
  );
}
