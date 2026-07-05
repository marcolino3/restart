"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import type { EmailTemplateCategory } from "./get-email-templates.action";

const TEMPLATES_PATH = "/admin/admissions/email-templates";

type MutationResult =
  | { success: true; id: string }
  | { success: false; error?: string };

type BooleanResult = { success: true } | { success: false; error?: string };

const CreateDocument = gql`
  mutation CreateEmailTemplate($input: CreateEmailTemplateInput!) {
    createEmailTemplate(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateEmailTemplate($input: UpdateEmailTemplateInput!) {
    updateEmailTemplate(input: $input) {
      id
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteEmailTemplate($id: ID!) {
    deleteEmailTemplate(id: $id)
  }
`;

export interface CreateEmailTemplateInput {
  name: string;
  category?: EmailTemplateCategory;
  subject: string;
  bodyHtml: string;
  description?: string | null;
  isAutomatic?: boolean;
}

export const createEmailTemplateAction = async (
  input: CreateEmailTemplateInput,
): Promise<MutationResult> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{ createEmailTemplate: { id: string } }>(
      CreateDocument,
      {
        input: {
          name: input.name,
          category: input.category ?? "ADMISSION",
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          description: input.description ?? null,
          isAutomatic: input.isAutomatic ?? false,
        },
      },
    );
    revalidatePath(TEMPLATES_PATH);
    return { success: true, id: resp.createEmailTemplate.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export interface UpdateEmailTemplateInput {
  id: string;
  name?: string;
  category?: EmailTemplateCategory;
  subject?: string;
  bodyHtml?: string;
  description?: string | null;
  isAutomatic?: boolean;
}

export const updateEmailTemplateAction = async (
  input: UpdateEmailTemplateInput,
): Promise<MutationResult> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{ updateEmailTemplate: { id: string } }>(
      UpdateDocument,
      { input },
    );
    revalidatePath(TEMPLATES_PATH);
    return { success: true, id: resp.updateEmailTemplate.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const deleteEmailTemplateAction = async (
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
