"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SelectFormFieldWithoutTranslations } from "@/components/form/form-fields/SelectFormFieldWithoutTranslations";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { SliderFormField } from "@/components/form/form-fields/SliderFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { WeeklyScheduleField } from "../WeeklyScheduleField";
import { ContractDocumentUpload } from "../ContractDocumentUpload";

interface Props {
  teamOptions: { label: string; value: string }[];
  draftId?: string;
}

const CONTRACT_TYPE_OPTIONS = [
  { label: "contractPermanent", value: "PERMANENT" },
  { label: "contractTemporary", value: "TEMPORARY" },
  { label: "contractHourly", value: "HOURLY" },
  { label: "contractInternship", value: "INTERNSHIP" },
  { label: "contractApprenticeship", value: "APPRENTICESHIP" },
];

const FUNCTION_OPTIONS = [
  { label: "functionClassLead", value: "Klassenleitung" },
  { label: "functionTeacher", value: "Lehrperson" },
  { label: "functionAssistant", value: "Assistenz" },
  { label: "functionKindergarten", value: "Pädagog:in Kinderhaus" },
  { label: "functionOffice", value: "Sekretariat" },
  { label: "functionPrincipal", value: "Schulleitung" },
];

export function StepContract({ teamOptions, draftId }: Props) {
  const t = useTranslations("EmployeeOnboarding");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("employment")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectFormField
              name="position"
              label="function"
              namespace="EmployeeOnboarding"
              placeholder="selectPlaceholder"
              options={FUNCTION_OPTIONS}
            />
            <SelectFormFieldWithoutTranslations
              name="teamId"
              label={t("team")}
              placeholder={t("selectTeam")}
              options={teamOptions}
            />
            <DatePickerFormField
              name="startDate"
              label="entryDate"
              namespace="EmployeeOnboarding"
              // Entry dates are typically in the future — allow them.
              disabledDate={(date) => date < new Date("1900-01-01")}
            />
            <SelectFormField
              name="contractType"
              label="contractType"
              namespace="EmployeeOnboarding"
              placeholder="selectPlaceholder"
              options={CONTRACT_TYPE_OPTIONS}
            />
          </div>
          <SliderFormField
            name="workloadPercent"
            label="workloadPercent"
            description="percentSuffix"
            namespace="EmployeeOnboarding"
            min={0}
            max={100}
            step={5}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputFormField
              name="weeklyHours"
              label="weeklyHours"
              namespace="EmployeeOnboarding"
              placeholder="42"
            />
            <InputFormField
              name="annualVacationDays"
              type="number"
              label="annualVacationDays"
              namespace="EmployeeOnboarding"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-semibold">
              {t("contractDocument")}
            </span>
            <ContractDocumentUpload draftId={draftId} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("workingHours")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">{t("scheduleHint")}</p>
          <WeeklyScheduleField />
          <SwitchFormField
            name="timeTrackingEnabled"
            description="timeTrackingFromEntry"
            namespace="EmployeeOnboarding"
          />
        </CardContent>
      </Card>
    </div>
  );
}
