"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type ContractTemplate = {
  id: string;
  name: string;
  bodyHtml: string;
  headerHtml: string | null;
  footerHtml: string | null;
  showLogo: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

const Document = gql`
  query ContractTemplates {
    contractTemplates {
      id
      name
      bodyHtml
      headerHtml
      footerHtml
      showLogo
      description
      createdAt
      updatedAt
    }
  }
`;

export const getContractTemplatesAction = async (): Promise<
  | { success: true; data: ContractTemplate[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      contractTemplates: ContractTemplate[];
    }>(Document);
    return { success: true, data: resp.contractTemplates };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load templates",
    };
  }
};
