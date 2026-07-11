"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { CountryComboboxFormField } from "@/components/form/form-fields/CountryComboboxFormField";
import { TagsInputFormField } from "@/components/form/form-fields/TagsInputFormField";
import { SocialSecurityNumberFormField } from "@/components/form/form-fields/SocialSecurityNumberFormField";
import { SensitiveDataNotice } from "@/components/common/SensitiveDataNotice";

/**
 * Shared master-data fields (Scope 1) rendered in BOTH the create form
 * (`StudentForm`) and the edit view (`StudentEditView`) so the two stay in
 * parity — see the create/update-parity rule. Personal fields only; the
 * `externalStudentId` lives with the school-data section and is rendered by
 * the caller.
 *
 * Nationalities use ISO country codes (like the org `country` field), not a
 * relation to the unseeded `country` table.
 *
 * Religion + AHV (social security number) are GDPR Art. 9 special-category
 * data — flagged in the UI via the `sensitiveHint` description.
 */
export function StudentMasterDataFields() {
  const { control } = useFormContext();
  const t = useTranslations("Students");

  return (
    <>
      <div className="flex gap-4">
        <InputFormField
          name="preferredName"
          label="preferredName"
          namespace="Students"
          width="w-1/2"
        />
        <InputFormField
          name="placeOfBirth"
          label="placeOfBirth"
          namespace="Students"
          width="w-1/2"
        />
      </div>

      <CountryComboboxFormField
        name="nationalities"
        label="nationalities"
        namespace="Students"
        multiple
        width="w-full"
      />

      <div className="flex gap-4">
        <TagsInputFormField
          name="firstLanguages"
          control={control}
          label="firstLanguages"
          namespace="Students"
        />
        <TagsInputFormField
          name="familyLanguages"
          control={control}
          label="familyLanguages"
          namespace="Students"
        />
      </div>

      <SensitiveDataNotice>{t("sensitiveHint")}</SensitiveDataNotice>
      <div className="flex gap-4">
        <InputFormField
          name="religion"
          label="religion"
          namespace="Students"
          width="w-1/2"
        />
        <SocialSecurityNumberFormField
          name="socialSecurityNumber"
          label="socialSecurityNumber"
          namespace="Students"
          width="w-1/2"
        />
      </div>
    </>
  );
}
