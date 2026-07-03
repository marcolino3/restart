"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadioCardFormField,
  type RadioCardOption,
} from "@/components/form/form-fields/RadioCardFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";

interface Props {
  roleOptions: RadioCardOption[];
}

export function StepRoles({ roleOptions }: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const { watch } = useFormContext();
  const email = watch("email") as string | undefined;

  const invitationOptions: RadioCardOption[] = [
    { value: "IMMEDIATE", label: t("inviteImmediate") },
    { value: "ON_ENTRY_DATE", label: t("inviteOnEntry") },
    { value: "MANUAL", label: t("inviteManual") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("role")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">{t("roleHint")}</p>
          {roleOptions.length ? (
            <RadioCardFormField name="roleId" options={roleOptions} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noRoles")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("access")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("loginEmail")}</span>
              <span className="text-sm text-muted-foreground">
                {email || "—"}
              </span>
            </div>
            <SelectFormField
              name="language"
              label="language"
              namespace="EmployeeOnboarding"
              options={[
                { label: "languageDe", value: "de" },
                { label: "languageEn", value: "en" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("invitation")}</span>
            <RadioCardFormField
              name="invitationTiming"
              options={invitationOptions}
              columns={1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
