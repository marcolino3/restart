"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";

const TEMPLATES_PATH = "/admin/employees/contract-templates";

type MutationResult =
  | { success: true; id: string }
  | { success: false; error?: string };

type BooleanResult = { success: true } | { success: false; error?: string };

const CreateDocument = gql`
  mutation CreateContractTemplate($input: CreateContractTemplateInput!) {
    createContractTemplate(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateContractTemplate($input: UpdateContractTemplateInput!) {
    updateContractTemplate(input: $input) {
      id
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteContractTemplate($id: ID!) {
    deleteContractTemplate(id: $id)
  }
`;

export interface CreateContractTemplateInput {
  name: string;
  bodyHtml: string;
  headerHtml?: string | null;
  footerHtml?: string | null;
  showLogo?: boolean;
  description?: string | null;
}

export const createContractTemplateAction = async (
  input: CreateContractTemplateInput,
): Promise<MutationResult> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      createContractTemplate: { id: string };
    }>(CreateDocument, {
      input: {
        name: input.name,
        bodyHtml: input.bodyHtml,
        headerHtml: input.headerHtml ?? null,
        footerHtml: input.footerHtml ?? null,
        showLogo: input.showLogo ?? true,
        description: input.description ?? null,
      },
    });
    revalidatePath(TEMPLATES_PATH);
    return { success: true, id: resp.createContractTemplate.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export interface UpdateContractTemplateInput {
  id: string;
  name?: string;
  bodyHtml?: string;
  headerHtml?: string | null;
  footerHtml?: string | null;
  showLogo?: boolean;
  description?: string | null;
}

export const updateContractTemplateAction = async (
  input: UpdateContractTemplateInput,
): Promise<MutationResult> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      updateContractTemplate: { id: string };
    }>(UpdateDocument, { input });
    revalidatePath(TEMPLATES_PATH);
    return { success: true, id: resp.updateContractTemplate.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const deleteContractTemplateAction = async (
  id: string,
): Promise<BooleanResult> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    revalidatePath(TEMPLATES_PATH);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
};
