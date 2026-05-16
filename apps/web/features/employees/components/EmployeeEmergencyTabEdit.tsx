"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";

import type { EmployeeEmergencyProfile } from "../actions/get-employee-emergency-profile.action";
import {
  EmployeeEmergencyFormSchema,
  EmployeeEmergencyFormOutput,
} from "../schemas/employee-emergency-form.schema";
import { upsertEmployeeEmergencyProfileAction } from "../actions/upsert-employee-emergency-profile.action";
import { FormRow } from "./EmployeeFormSections";

interface Props {
  employeeId: string;
  profile: EmployeeEmergencyProfile | null;
}

const relationshipOptions = [
  { label: "contactRelationship.SPOUSE", value: "SPOUSE" },
  { label: "contactRelationship.PARTNER", value: "PARTNER" },
  { label: "contactRelationship.PARENT", value: "PARENT" },
  { label: "contactRelationship.CHILD", value: "CHILD" },
  { label: "contactRelationship.SIBLING", value: "SIBLING" },
  { label: "contactRelationship.FRIEND", value: "FRIEND" },
  { label: "contactRelationship.OTHER", value: "OTHER" },
];

const bloodTypeOptions = [
  { label: "bloodType.A_POS", value: "A_POS" },
  { label: "bloodType.A_NEG", value: "A_NEG" },
  { label: "bloodType.B_POS", value: "B_POS" },
  { label: "bloodType.B_NEG", value: "B_NEG" },
  { label: "bloodType.AB_POS", value: "AB_POS" },
  { label: "bloodType.AB_NEG", value: "AB_NEG" },
  { label: "bloodType.O_POS", value: "O_POS" },
  { label: "bloodType.O_NEG", value: "O_NEG" },
];

export default function EmployeeEmergencyTabEdit({ employeeId, profile }: Props) {
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(EmployeeEmergencyFormSchema),
    defaultValues: {
      employeeId,
      contact1Name: profile?.contact1Name ?? "",
      contact1Relationship: profile?.contact1Relationship ?? undefined,
      contact1Phone: profile?.contact1Phone ?? "",
      contact1Email: profile?.contact1Email ?? "",
      contact2Name: profile?.contact2Name ?? "",
      contact2Relationship: profile?.contact2Relationship ?? undefined,
      contact2Phone: profile?.contact2Phone ?? "",
      contact2Email: profile?.contact2Email ?? "",
      bloodType: profile?.bloodType ?? undefined,
      allergies: profile?.allergies ?? "",
      chronicConditions: profile?.chronicConditions ?? "",
      emergencyMedications: profile?.emergencyMedications ?? "",
      primaryDoctorName: profile?.primaryDoctorName ?? "",
      primaryDoctorPhone: profile?.primaryDoctorPhone ?? "",
      pharmacyName: profile?.pharmacyName ?? "",
    },
  });

  const onValid = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () =>
        upsertEmployeeEmergencyProfileAction(
          values as EmployeeEmergencyFormOutput,
        ),
      successMessage: tE("emergency.saved"),
      errorMessage: tE("emergency.saveError"),
      onSuccess: () => router.refresh(),
    });
  };

  const onInvalid = (errors: Record<string, unknown>) => {
    console.warn("Emergency form validation errors:", errors);
    toast.error(tE("validationError"));
  };

  const renderContact = (slot: "1" | "2", title: string) => (
    <>
      <SectionHeader title={title} mt={slot === "2"} />
      <SectionBody>
        <FormRow label={tE("emergency.contactName")}>
          <InputFormField name={`contact${slot}Name`} />
        </FormRow>
        <FormRow label={tE("emergency.contactRelationship")}>
          <SelectFormField
            name={`contact${slot}Relationship`}
            options={relationshipOptions}
            namespace="Employees"
            placeholder="selectPlaceholder"
            width="w-full sm:w-1/2"
          />
        </FormRow>
        <FormRow label={tE("emergency.contactPhone")}>
          <InputFormField
            name={`contact${slot}Phone`}
            type="tel"
            placeholder="+41 00 000 00 00"
          />
        </FormRow>
        <FormRow label={tE("emergency.contactEmail")}>
          <InputFormField name={`contact${slot}Email`} type="email" />
        </FormRow>
      </SectionBody>
    </>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid, onInvalid)}>
        {renderContact("1", tE("emergency.contactPrimary"))}
        {renderContact("2", tE("emergency.contactSecondary"))}

        <SectionHeader title={tE("emergency.healthInfo")} mt />
        <SectionBody>
          <FormRow label={tE("emergency.bloodType")}>
            <SelectFormField
              name="bloodType"
              options={bloodTypeOptions}
              namespace="Employees"
              placeholder="selectPlaceholder"
              width="w-full sm:w-1/3"
            />
          </FormRow>
          <FormRow label={tE("emergency.allergies")}>
            <TextareaFormField
              name="allergies"
              placeholder={tE("emergency.allergiesPlaceholder")}
            />
          </FormRow>
          <FormRow label={tE("emergency.chronicConditions")}>
            <TextareaFormField name="chronicConditions" />
          </FormRow>
          <FormRow label={tE("emergency.medications")}>
            <TextareaFormField
              name="emergencyMedications"
              placeholder={tE("emergency.medicationsPlaceholder")}
            />
          </FormRow>
          <FormRow label={tE("emergency.primaryDoctorName")}>
            <InputFormField name="primaryDoctorName" />
          </FormRow>
          <FormRow label={tE("emergency.primaryDoctorPhone")}>
            <InputFormField
              name="primaryDoctorPhone"
              type="tel"
              placeholder="+41 00 000 00 00"
            />
          </FormRow>
          <FormRow label={tE("emergency.pharmacy")}>
            <InputFormField name="pharmacyName" />
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
