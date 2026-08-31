"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const ConfiguredDocument = gql`
  query ContractAiConfigured {
    contractAiConfigured
  }
`;

const TemplateDraftDocument = gql`
  mutation GenerateContractTemplateAiDraft($instructions: String!) {
    generateContractTemplateAiDraft(instructions: $instructions)
  }
`;

const ContractDraftDocument = gql`
  mutation GenerateContractAiDraft($contractId: ID!, $instructions: String!) {
    generateContractAiDraft(contractId: $contractId, instructions: $instructions)
  }
`;

export const getContractAiConfiguredAction = async (): Promise<boolean> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{ contractAiConfigured: boolean }>(
      ConfiguredDocument,
    );
    return resp.contractAiConfigured;
  } catch (error) {
    console.error(error);
    return false;
  }
};

type DraftResult =
  | { success: true; html: string }
  | { success: false; error?: string };

export const generateContractTemplateAiDraftAction = async (
  instructions: string,
): Promise<DraftResult> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      generateContractTemplateAiDraft: string;
    }>(TemplateDraftDocument, { instructions });
    return { success: true, html: resp.generateContractTemplateAiDraft };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI draft failed",
    };
  }
};

export const generateContractAiDraftAction = async (
  contractId: string,
  instructions: string,
): Promise<DraftResult> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{ generateContractAiDraft: string }>(
      ContractDraftDocument,
      { contractId, instructions },
    );
    return { success: true, html: resp.generateContractAiDraft };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI draft failed",
    };
  }
};
