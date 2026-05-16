"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  CountryInputFieldType,
  CountryInputTemplate,
  CountryInputValidatorKind,
} from "../types";

export type UpsertCountryInputTemplateInput = {
  countryCode: string;
  fieldType: CountryInputFieldType;
  mask: string;
  placeholder?: string | null;
  maxLength?: number | null;
  regex?: string | null;
  prefix?: string | null;
  validatorKind?: CountryInputValidatorKind;
};

const UpsertDocument = gql`
  mutation UpsertCountryInputTemplate(
    $input: UpsertCountryInputTemplateInput!
  ) {
    upsertCountryInputTemplate(input: $input) {
      id
      countryCode
      fieldType
      mask
      placeholder
      maxLength
      regex
      prefix
      validatorKind
    }
  }
`;

export const upsertCountryInputTemplateAction = async (
  input: UpsertCountryInputTemplateInput,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { upsertCountryInputTemplate } = await client.request<{
      upsertCountryInputTemplate: CountryInputTemplate;
    }>(UpsertDocument, { input });
    revalidatePath(`/${locale}/admin/settings/country-templates`);
    revalidatePath(
      `/${locale}/admin/settings/country-templates/${upsertCountryInputTemplate.countryCode}`,
    );
    return { success: true as const, data: upsertCountryInputTemplate };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to save template" };
  }
};
