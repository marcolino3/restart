"use server";

import { serverCookieGqlClientWithoutRedirect } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { CountryInputTemplate } from "../types";

const ListDocument = gql`
  query CountryInputTemplates {
    countryInputTemplates {
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

export const getCountryInputTemplatesAction = async (): Promise<{
  success: boolean;
  data: CountryInputTemplate[];
  error?: string;
}> => {
  // No auto-redirect: a SuperAdmin without an active org legitimately cannot
  // read org-scoped templates. The empty-array fallback below is the correct
  // outcome there — redirecting to /sign-in would log them out instead.
  const client = await serverCookieGqlClientWithoutRedirect();
  try {
    const { countryInputTemplates } = await client.request<{
      countryInputTemplates: CountryInputTemplate[];
    }>(ListDocument);
    return { success: true, data: countryInputTemplates };
  } catch (error) {
    console.error(error);
    return { success: false, data: [], error: "Failed to load templates" };
  }
};
