"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { CountryComboboxFormField } from "@/components/form/form-fields/CountryComboboxFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";

import type { EmployeeHrProfile } from "../actions/get-employee-hr-profile.action";
import {
  EmployeeHrProfileFormSchema,
  EmployeeHrProfileFormOutput,
} from "../schemas/employee-hr-profile-form.schema";
import { upsertEmployeeHrProfileAction } from "../actions/upsert-employee-hr-profile.action";
import { FormRow } from "./EmployeeFormSections";

interface Props {
  employeeId: string;
  profile: EmployeeHrProfile | null;
  onSaved?: () => void;
}

const residencePermitOptions = [
  { label: "residencePermitType.CITIZEN", value: "CITIZEN" },
  { label: "residencePermitType.B", value: "B" },
  { label: "residencePermitType.C", value: "C" },
  { label: "residencePermitType.L", value: "L" },
  { label: "residencePermitType.G", value: "G" },
  { label: "residencePermitType.F", value: "F" },
  { label: "residencePermitType.OTHER", value: "OTHER" },
];

const maritalStatusOptions = [
  { label: "maritalStatus.SINGLE", value: "SINGLE" },
  { label: "maritalStatus.MARRIED", value: "MARRIED" },
  {
    label: "maritalStatus.REGISTERED_PARTNERSHIP",
    value: "REGISTERED_PARTNERSHIP",
  },
  { label: "maritalStatus.SEPARATED", value: "SEPARATED" },
  { label: "maritalStatus.DIVORCED", value: "DIVORCED" },
  { label: "maritalStatus.WIDOWED", value: "WIDOWED" },
];

const onboardingStatusOptions = [
  { label: "onboardingStatus.NOT_STARTED", value: "NOT_STARTED" },
  { label: "onboardingStatus.IN_PROGRESS", value: "IN_PROGRESS" },
  { label: "onboardingStatus.COMPLETED", value: "COMPLETED" },
];

export default function EmployeeHrTabEdit({
  employeeId,
  profile,
  onSaved,
}: Props) {
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(EmployeeHrProfileFormSchema),
    defaultValues: {
      employeeId,
      iban: profile?.iban ?? "",
      bankAccountHolder: profile?.bankAccountHolder ?? "",
      bankName: profile?.bankName ?? "",
      bvgProvider: profile?.bvgProvider ?? "",
      bvgInsuranceNumber: profile?.bvgInsuranceNumber ?? "",
      uvgProvider: profile?.uvgProvider ?? "",
      withholdingTaxCode: profile?.withholdingTaxCode ?? "",
      nationality: profile?.nationality ?? "",
      residencePermitType: profile?.residencePermitType ?? undefined,
      residencePermitValidUntil: profile?.residencePermitValidUntil
        ? new Date(profile.residencePermitValidUntil)
        : null,
      maritalStatus: profile?.maritalStatus ?? undefined,
      denomination: profile?.denomination ?? "",
      numberOfChildren: profile?.numberOfChildren ?? null,
      onboardingStatus: profile?.onboardingStatus ?? undefined,
      ndaSigned: profile?.ndaSigned ?? false,
      criminalRecordSubmitted: profile?.criminalRecordSubmitted ?? false,
    },
  });

  const onValid = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () =>
        upsertEmployeeHrProfileAction(values as EmployeeHrProfileFormOutput),
      successMessage: tE("hr.saved"),
      errorMessage: tE("hr.saveError"),
      onSuccess: () => {
        if (onSaved) onSaved();
        else router.refresh();
      },
    });
  };

  const onInvalid = (errors: Record<string, unknown>) => {
    console.warn("HR form validation errors:", errors);
    toast.error(tE("validationError"));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid, onInvalid)}>
        {/* Bankverbindung */}
        <SectionHeader title={tE("hr.bankAccount")} />
        <SectionBody>
          <FormRow label={tE("hr.iban")}>
            <InputFormField name="iban" placeholder="CH00 0000 0000 0000 0000 0" />
          </FormRow>
          <FormRow label={tE("hr.bankAccountHolder")}>
            <InputFormField name="bankAccountHolder" />
          </FormRow>
          <FormRow label={tE("hr.bankName")}>
            <InputFormField name="bankName" />
          </FormRow>
        </SectionBody>

        {/* Versicherungen & Steuern */}
        <SectionHeader title={tE("hr.insurances")} mt />
        <SectionBody>
          <FormRow label={tE("hr.bvgProvider")}>
            <InputFormField name="bvgProvider" />
          </FormRow>
          <FormRow label={tE("hr.bvgInsuranceNumber")}>
            <InputFormField name="bvgInsuranceNumber" />
          </FormRow>
          <FormRow label={tE("hr.uvgProvider")}>
            <InputFormField name="uvgProvider" />
          </FormRow>
          <FormRow label={tE("hr.withholdingTaxCode")}>
            <InputFormField
              name="withholdingTaxCode"
              placeholder="A0N"
              width="w-full sm:w-1/3"
            />
          </FormRow>
        </SectionBody>

        {/* Stammdaten */}
        <SectionHeader title={tE("hr.personalData")} mt />
        <SectionBody>
          <FormRow label={tE("hr.nationality")}>
            <CountryComboboxFormField
              name="nationality"
              label=""
              width="w-full sm:w-1/2"
            />
          </FormRow>
          <FormRow label={tE("hr.residencePermitType")}>
            <SelectFormField
              name="residencePermitType"
              options={residencePermitOptions}
              namespace="Employees"
              placeholder="selectPlaceholder"
              width="w-full sm:w-1/2"
            />
          </FormRow>
          <FormRow label={tE("hr.residencePermitValidUntil")}>
            <DatePickerFormField
              name="residencePermitValidUntil"
              namespace="Employees"
              width="w-full sm:w-1/2"
              disabledDate={() => false}
            />
          </FormRow>
          <FormRow label={tE("hr.maritalStatus")}>
            <SelectFormField
              name="maritalStatus"
              options={maritalStatusOptions}
              namespace="Employees"
              placeholder="selectPlaceholder"
              width="w-full sm:w-1/2"
            />
          </FormRow>
          <FormRow label={tE("hr.denomination")}>
            <InputFormField name="denomination" />
          </FormRow>
          <FormRow label={tE("hr.numberOfChildren")}>
            <InputFormField
              name="numberOfChildren"
              type="number"
              width="w-32"
            />
          </FormRow>
        </SectionBody>

        {/* Onboarding / Compliance */}
        <SectionHeader title={tE("hr.onboardingCompliance")} mt />
        <SectionBody>
          <FormRow label={tE("hr.onboardingStatus")}>
            <SelectFormField
              name="onboardingStatus"
              options={onboardingStatusOptions}
              namespace="Employees"
              placeholder="selectPlaceholder"
              width="w-full sm:w-1/2"
            />
          </FormRow>
          <FormRow label={tE("hr.ndaSigned")}>
            <SwitchFormField name="ndaSigned" namespace="Employees" />
          </FormRow>
          <FormRow label={tE("hr.criminalRecordSubmitted")}>
            <SwitchFormField
              name="criminalRecordSubmitted"
              namespace="Employees"
            />
          </FormRow>
        </SectionBody>

        <FormActionButtons
          disabled={form.formState.isSubmitting}
          onCancel={() =>
            router.push(ROUTES.admin.employeesView(locale, employeeId))
          }
        />
      </form>
    </Form>
  );
}

interface SectionHeaderProps {
  title: string;
  mt?: boolean;
}
const SectionHeader = ({ title, mt }: SectionHeaderProps) => (
  <div className={`${mt ? "mt-10" : ""} px-4 sm:px-0`}>
    <h3 className="text-base/7 font-semibold text-foreground">{title}</h3>
  </div>
);

const SectionBody = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-6 border-t border-border">
    <dl className="divide-y divide-border">{children}</dl>
  </div>
);
