"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeAvatar } from "../EmployeeAvatar";
import {
  DescriptionList,
  DescriptionRow,
} from "@/components/common/DescriptionList";
import type { RadioCardOption } from "@/components/form/form-fields/RadioCardFormField";

interface Props {
  roleOptions: RadioCardOption[];
  teamOptions: { label: string; value: string }[];
}

export function OnboardingSummaryAside({ roleOptions, teamOptions }: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const { watch } = useFormContext();

  const firstName = watch("firstName") as string;
  const lastName = watch("lastName") as string;
  const email = watch("email") as string | undefined;
  const dateOfBirth = watch("dateOfBirth") as Date | null | undefined;
  const position = watch("position") as string | undefined;
  const workloadPercent = watch("workloadPercent") as number | undefined;
  const startDate = watch("startDate") as Date | null | undefined;
  const teamId = watch("teamId") as string | undefined;
  const roleId = watch("roleId") as string | undefined;
  const invitationTiming = watch("invitationTiming") as string | undefined;

  const roleLabel = roleOptions.find((r) => r.value === roleId)?.label;
  const teamLabel = teamOptions.find((tm) => tm.value === teamId)?.label;
  const fmtDate = (d?: Date | null) =>
    d ? new Intl.DateTimeFormat("de-CH").format(d) : undefined;

  const invitationLabel = invitationTiming
    ? t(
        invitationTiming === "IMMEDIATE"
          ? "inviteImmediate"
          : invitationTiming === "ON_ENTRY_DATE"
            ? "inviteOnEntry"
            : "inviteManual",
      )
    : undefined;

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>{t("summary")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <EmployeeAvatar
            firstName={firstName}
            lastName={lastName}
            className="h-11 w-11 text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {fullName || t("newEmployee")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {email || "—"}
            </p>
          </div>
        </div>
        <DescriptionList>
          <DescriptionRow label={t("dateOfBirth")} muted={!dateOfBirth}>
            {fmtDate(dateOfBirth) ?? t("step1")}
          </DescriptionRow>
          <DescriptionRow label={t("function")} muted={!position}>
            {position ?? t("step2")}
          </DescriptionRow>
          <DescriptionRow label={t("workloadPercent")} muted={!workloadPercent}>
            {workloadPercent ? `${workloadPercent}%` : t("step2")}
          </DescriptionRow>
          <DescriptionRow label={t("team")} muted={!teamLabel}>
            {teamLabel ?? t("step2")}
          </DescriptionRow>
          <DescriptionRow label={t("entryDate")} muted={!startDate}>
            {fmtDate(startDate) ?? t("step2")}
          </DescriptionRow>
          <DescriptionRow label={t("role")} muted={!roleLabel}>
            {roleLabel ?? t("step3")}
          </DescriptionRow>
          <DescriptionRow label={t("invitation")} muted={!invitationLabel}>
            {invitationLabel ?? t("step3")}
          </DescriptionRow>
        </DescriptionList>
      </CardContent>
    </Card>
  );
}
