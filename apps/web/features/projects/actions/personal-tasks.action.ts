"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { TaskFormOutput } from "../schemas/task-form.schema";

const CreateDocument = gql`
  mutation CreatePersonalTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdatePersonalTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
    }
  }
`;

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Create a personal task (no project): the creator becomes its sole assignee. */
export const createPersonalTaskAction = async (values: TaskFormOutput) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  const input = {
    // no projectId → personal task
    title: values.title,
    description: values.description ?? null,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate ? toIsoDate(values.dueDate) : null,
  };
  try {
    const { createTask } = await client.request<{ createTask: { id: string } }>(
      CreateDocument,
      { input }
    );
    revalidatePath(ROUTES.admin.myTasks(locale));
    return { success: true as const, data: createTask };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const updatePersonalTaskAction = async (
  id: string,
  values: TaskFormOutput
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  const input = {
    id,
    title: values.title,
    description: values.description ?? null,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate ? toIsoDate(values.dueDate) : null,
  };
  try {
    const { updateTask } = await client.request<{ updateTask: { id: string } }>(
      UpdateDocument,
      { input }
    );
    revalidatePath(ROUTES.admin.myTasks(locale));
    return { success: true as const, data: updateTask };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
