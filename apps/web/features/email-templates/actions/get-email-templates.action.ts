"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type EmailTemplateCategory = "ADMISSION" | "GENERAL";

export type EmailTemplate = {
  id: string;
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  bodyHtml: string;
  description: string | null;
  isAutomatic: boolean;
  sentCount: number;
  createdAt: string;
  updatedAt: string;
};

const Document = gql`
  query EmailTemplates($category: EmailTemplateCategory) {
    emailTemplates(category: $category) {
      id
      name
      category
      subject
      bodyHtml
      description
      isAutomatic
      sentCount
      createdAt
      updatedAt
    }
  }
`;

export const getEmailTemplatesAction = async (
  category?: EmailTemplateCategory,
): Promise<
  { success: true; data: EmailTemplate[] } | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{ emailTemplates: EmailTemplate[] }>(
      Document,
      { category: category ?? null },
    );
    return { success: true, data: resp.emailTemplates };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load templates",
    };
  }
};
