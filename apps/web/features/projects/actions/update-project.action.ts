"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { ProjectFormOutput } from "../schemas/project-form.schema";

type Response = { updateProject: { id: string } };

const Document = gql`
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      id
    }
  }
`;

export const updateProjectAction = async (
  id: string,
  values: ProjectFormOutput
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  const input = {
    id,
    title: values.title,
    description: values.description ?? null,
    status: values.status,
    color: values.color ?? null,
  };

  try {
    const { updateProject } = await client.request<Response>(Document, {
      input,
    });
    revalidatePath(ROUTES.admin.projects(locale));
    revalidatePath(ROUTES.admin.projectsBoard(locale, id));
    return { success: true as const, data: updateProject };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
