"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type ContractDocumentPreview = {
  bodyHtml: string;
  headerHtml: string | null;
  footerHtml: string | null;
  showLogo: boolean;
};

const Document = gql`
  query PreviewContractDocument($contractId: ID!, $templateId: ID!) {
    previewContractDocument(contractId: $contractId, templateId: $templateId) {
      bodyHtml
      headerHtml
      footerHtml
      showLogo
    }
  }
`;

export const previewContractDocumentAction = async (
  contractId: string,
  templateId: string,
): Promise<
  | { success: true; data: ContractDocumentPreview }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      previewContractDocument: ContractDocumentPreview;
    }>(Document, { contractId, templateId });
    return { success: true, data: resp.previewContractDocument };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Preview failed",
    };
  }
};
