"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

type Response = { createProjectFromTemplate: { id: string } };

const Document = gql`
  mutation CreateProjectFromTemplate($input: CreateProjectFromTemplateInput!) {
    createProjectFromTemplate(input: $input) {
      id
    }
  }
`;

export const createFromTemplateAction = async (input: {
  templateId: string;
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  memberMembershipIds?: string[];
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createProjectFromTemplate } = await client.request<Response>(
      Document,
      { input }
    );
    revalidatePath(ROUTES.admin.projects(locale));
    return { success: true as const, data: createProjectFromTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
