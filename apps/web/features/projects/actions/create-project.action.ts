"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { ProjectFormOutput } from "../schemas/project-form.schema";

type Response = { createProject: { id: string } };

const Document = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
    }
  }
`;

/** Date → ISO date string (YYYY-MM-DD) without timezone drift. */
function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const createProjectAction = async (values: ProjectFormOutput) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  const input = {
    title: values.title,
    description: values.description ?? null,
    status: values.status,
    color: values.color ?? null,
    dueDate: values.dueDate ? toIsoDate(values.dueDate) : null,
    memberMembershipIds: values.memberMembershipIds ?? [],
  };

  try {
    const { createProject } = await client.request<Response>(Document, {
      input,
    });
    revalidatePath(ROUTES.admin.projects(locale));
    return { success: true as const, data: createProject };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
