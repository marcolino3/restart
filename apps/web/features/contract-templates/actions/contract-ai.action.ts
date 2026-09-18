"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const ConfiguredDocument = gql`
  query ContractAiConfigured {
    contractAiConfigured
  }
`;

const ChatDocument = gql`
  mutation ContractAiChat($input: ContractAiChatInput!) {
    contractAiChat(input: $input) {
      reply
      html
    }
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

export interface ContractAiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ContractAiChatResult =
  | { success: true; reply: string; html: string | null }
  | { success: false; error?: string };

export const contractAiChatAction = async (
  messages: ContractAiChatMessage[],
  options?: { currentHtml?: string; contractId?: string },
): Promise<ContractAiChatResult> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      contractAiChat: { reply: string; html: string | null };
    }>(ChatDocument, {
      input: {
        messages,
        currentHtml: options?.currentHtml || null,
        contractId: options?.contractId || null,
      },
    });
    return {
      success: true,
      reply: resp.contractAiChat.reply,
      html: resp.contractAiChat.html,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI chat failed",
    };
  }
};
