"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SocialSecurityNumberFormField } from "@/components/form/form-fields/SocialSecurityNumberFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { CountryComboboxFormField } from "@/components/form/form-fields/CountryComboboxFormField";
import { ROUTES } from "@/constants/routes";
import { Persona } from "@restart/shared-types/graphql";
import { useUser } from "@/features/users/context/current-user.context";

import type { EmployeeDetail } from "../actions/get-employee-by-id.action";

const mapEnumToOptions = (enumObj: Record<string, string>) =>
  Object.values(enumObj).map((value) => ({ value, label: value }));

const personaOptions = mapEnumToOptions(Persona);

interface FormRowProps {
  label: string;
  children: React.ReactNode;
}

export const FormRow = ({ label, children }: FormRowProps) => (
  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
    <div className="text-sm/6 font-medium text-foreground sm:pt-2">{label}</div>
    <div className="mt-1 sm:col-span-2 sm:mt-0">{children}</div>
  </div>
);

interface PersonalSectionProps {
  employee?: EmployeeDetail;
  orgCountry?: string | null;
  isEdit: boolean;
}

export const PersonalEmploymentSection = ({
  employee,
  orgCountry,
  isEdit,
}: PersonalSectionProps) => {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const currentUser = useUser();
  const user = employee?.membership?.user;
  const primaryEmail = user?.userEmails?.find((e) => e.isPrimary)?.email ?? "";

  return (
    <div className="border-t border-border">
      <dl className="divide-y divide-border">
        <FormRow label={t("salutation")}>
          <SelectFormField
            name="title"
            placeholder="selectPlaceholder"
            options={[
              { label: "titleMr", value: "Herr" },
              { label: "titleMs", value: "Frau" },
            ]}
            width="w-full sm:w-1/2"
          />
        </FormRow>

        <FormRow label={t("firstName")}>
          <InputFormField name="firstName" />
        </FormRow>

        <FormRow label={t("lastName")}>
          <InputFormField name="lastName" />
        </FormRow>

        <FormRow label={t("dateOfBirth")}>
          <DatePickerFormField name="dateOfBirth" width="w-full sm:w-1/2" />
        </FormRow>

        <FormRow label={t("socialSecurityNumber")}>
          <SocialSecurityNumberFormField
            name="socialSecurityNumber"
            country={orgCountry}
          />
        </FormRow>

        <FormRow label={t("email")}>
          {isEdit ? (
            <div className="flex flex-wrap items-center gap-2 sm:pt-2">
              <span className="text-sm text-muted-foreground">
                {primaryEmail}
              </span>
              <Badge variant="secondary" className="text-xs">
                {t("primaryEmail")}
              </Badge>
              {currentUser?.isSuperAdmin && user?.id && (
                <Link
                  href={ROUTES.admin.usersEdit(locale, user.id)}
                  className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {t("manageEmails")}
                </Link>
              )}
            </div>
          ) : (
            <InputFormField name="email" type="email" />
          )}
        </FormRow>

        <FormRow label={t("phone")}>
          <InputFormField name="contactPhone" type="tel" />
        </FormRow>

        <FormRow label={t("persona")}>
          <SelectFormField
            name="persona"
            options={personaOptions}
            width="w-full sm:w-1/2"
          />
        </FormRow>

        <FormRow label={tE("timeTrackingEnabled")}>
          <SwitchFormField
            name="timeTrackingEnabled"
            description="timeTrackingEnabledDescription"
            namespace="Employees"
          />
        </FormRow>
      </dl>
    </div>
  );
};

export const AddressSection = () => {
  const t = useTranslations("Common");

  return (
    <div className="border-t border-border">
      <dl className="divide-y divide-border">
        <FormRow label={t("street")}>
          <div className="flex gap-2">
            <div className="flex-1">
              <InputFormField name="street" placeholder={t("street")} />
            </div>
            <div className="w-24">
              <InputFormField
                name="houseNumber"
                placeholder={t("houseNumberShort")}
              />
            </div>
          </div>
        </FormRow>

        <FormRow label={t("addressLine2")}>
          <InputFormField
            name="addressLine2"
            placeholder={t("addressLine2Placeholder")}
          />
        </FormRow>

        <FormRow label={t("postalCode")}>
          <div className="flex gap-2">
            <div className="w-32">
              <InputFormField name="postalCode" placeholder={t("postalCode")} />
            </div>
            <div className="flex-1">
              <InputFormField name="city" placeholder={t("city")} />
            </div>
          </div>
        </FormRow>

        <FormRow label={t("country")}>
          <CountryComboboxFormField
            name="country"
            label=""
            width="w-full sm:w-1/2"
          />
        </FormRow>
      </dl>
    </div>
  );
};
