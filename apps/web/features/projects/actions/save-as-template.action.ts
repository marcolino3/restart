"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

type Response = { saveProjectAsTemplate: { id: string } };

const Document = gql`
  mutation SaveProjectAsTemplate($input: SaveProjectAsTemplateInput!) {
    saveProjectAsTemplate(input: $input) {
      id
    }
  }
`;

export const saveAsTemplateAction = async (input: {
  projectId: string;
  title: string;
  description?: string | null;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { saveProjectAsTemplate } = await client.request<Response>(Document, {
      input,
    });
    revalidatePath(ROUTES.admin.projectTemplates(locale));
    return { success: true as const, data: saveProjectAsTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
