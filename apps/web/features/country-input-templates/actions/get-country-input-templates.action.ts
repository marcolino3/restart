"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
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
  const client = await serverCookieGqlClient();
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
