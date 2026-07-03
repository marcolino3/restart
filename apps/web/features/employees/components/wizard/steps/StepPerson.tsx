"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { SocialSecurityNumberFormField } from "@/components/form/form-fields/SocialSecurityNumberFormField";
import { PhoneFormField } from "@/components/form/form-fields/PhoneFormField";
import { UploadFormField } from "@/components/form/form-fields/UploadFormField";
import { AddressSection } from "../../EmployeeFormSections";

interface Props {
  orgCountry?: string | null;
  /** Draft employee id — required before a photo can be uploaded. */
  draftId?: string;
}

export function StepPerson({ orgCountry, draftId }: Props) {
  const t = useTranslations("EmployeeOnboarding");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("personalDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {draftId ? (
            <UploadFormField
              name="avatarUrl"
              label="photo"
              namespace="EmployeeOnboarding"
              entity="employees"
              id={draftId}
              width="w-full sm:w-1/2"
            />
          ) : (
            <p className="text-xs text-muted-foreground">{t("photoAfterSave")}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectFormField
              name="title"
              label="salutation"
              placeholder="selectPlaceholder"
              options={[
                { label: "titleMr", value: "Herr" },
                { label: "titleMs", value: "Frau" },
              ]}
            />
            <div />
            <InputFormField name="firstName" label="firstName" />
            <InputFormField name="lastName" label="lastName" />
            <DatePickerFormField name="dateOfBirth" label="dateOfBirth" />
            <SocialSecurityNumberFormField
              name="socialSecurityNumber"
              country={orgCountry}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("contact")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputFormField
              name="email"
              type="email"
              label="emailLogin"
              namespace="EmployeeOnboarding"
            />
            <InputFormField
              name="privateEmail"
              type="email"
              label="privateEmail"
              namespace="EmployeeOnboarding"
            />
            <PhoneFormField name="contactPhone" country={orgCountry} />
            <InputFormField
              name="contactPhone2"
              type="tel"
              label="phone2"
              namespace="EmployeeOnboarding"
            />
          </div>
          <AddressSection />
        </CardContent>
      </Card>
    </div>
  );
}
