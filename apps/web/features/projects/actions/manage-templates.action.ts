"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { TemplateFormOutput } from "../schemas/template-form.schema";

const CreateDocument = gql`
  mutation CreateProjectTemplate($input: CreateProjectTemplateInput!) {
    createProjectTemplate(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateProjectTemplate($input: UpdateProjectTemplateInput!) {
    updateProjectTemplate(input: $input) {
      id
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteProjectTemplate($id: ID!) {
    deleteProjectTemplate(id: $id)
  }
`;

const taskInputs = (values: TemplateFormOutput) =>
  values.tasks.map((task) => ({
    title: task.title,
    description: task.description ?? null,
    priority: task.priority,
    dueOffsetDays:
      task.dueOffsetDays === undefined ? null : task.dueOffsetDays,
  }));

export const createTemplateAction = async (values: TemplateFormOutput) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  const input = {
    title: values.title,
    description: values.description ?? null,
    tasks: taskInputs(values),
  };
  try {
    const { createProjectTemplate } = await client.request<{
      createProjectTemplate: { id: string };
    }>(CreateDocument, { input });
    revalidatePath(ROUTES.admin.projectTemplates(locale));
    return { success: true as const, data: createProjectTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const updateTemplateAction = async (
  id: string,
  values: TemplateFormOutput
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  const input = {
    id,
    title: values.title,
    description: values.description ?? null,
    tasks: taskInputs(values),
  };
  try {
    const { updateProjectTemplate } = await client.request<{
      updateProjectTemplate: { id: string };
    }>(UpdateDocument, { input });
    revalidatePath(ROUTES.admin.projectTemplates(locale));
    return { success: true as const, data: updateProjectTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const deleteTemplateAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { deleteProjectTemplate } = await client.request<{
      deleteProjectTemplate: boolean;
    }>(DeleteDocument, { id });
    revalidatePath(ROUTES.admin.projectTemplates(locale));
    return { success: true as const, data: deleteProjectTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
