"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

type Response = { deleteProject: boolean };

const Document = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const deleteProjectAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { deleteProject } = await client.request<Response>(Document, { id });
    revalidatePath(ROUTES.admin.projects(locale));
    return { success: true as const, data: deleteProject };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
