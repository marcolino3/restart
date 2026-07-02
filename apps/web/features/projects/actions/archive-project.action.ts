"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

type Response = { archiveProject: { id: string; isArchived: boolean } };

const Document = gql`
  mutation ArchiveProject($id: ID!, $archived: Boolean!) {
    archiveProject(id: $id, archived: $archived) {
      id
      isArchived
    }
  }
`;

export const archiveProjectAction = async (id: string, archived: boolean) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { archiveProject } = await client.request<Response>(Document, {
      id,
      archived,
    });
    revalidatePath(ROUTES.admin.projects(locale));
    revalidatePath(ROUTES.admin.projectsBoard(locale, id));
    return { success: true as const, data: archiveProject };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
