"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { TaskFormOutput } from "../schemas/task-form.schema";
import type { TaskStatus } from "../types";

const CreateDocument = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
    }
  }
`;

const MoveDocument = gql`
  mutation MoveTask($input: MoveTaskInput!) {
    moveTask(input: $input) {
      id
      status
      sortOrder
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

const revalidate = (locale: string, projectId?: string | null) => {
  if (projectId) revalidatePath(ROUTES.admin.projectsBoard(locale, projectId));
  revalidatePath(ROUTES.admin.myTasks(locale));
};

export const createTaskAction = async (
  projectId: string,
  values: TaskFormOutput
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  const input = {
    projectId,
    title: values.title,
    description: values.description ?? null,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate ? toIsoDate(values.dueDate) : null,
    dueTime: values.dueTime ? values.dueTime : null,
    checklist: toChecklistInput(values),
    assigneeMembershipIds: values.assigneeMembershipIds ?? [],
  };
  try {
    const { createTask } = await client.request<{ createTask: { id: string } }>(
      CreateDocument,
      { input }
    );
    revalidate(locale, projectId);
    return { success: true as const, data: createTask };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const updateTaskAction = async (
  id: string,
  projectId: string,
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
    dueTime: values.dueTime ? values.dueTime : null,
    checklist: toChecklistInput(values),
    assigneeMembershipIds: values.assigneeMembershipIds ?? [],
  };
  try {
    const { updateTask } = await client.request<{ updateTask: { id: string } }>(
      UpdateDocument,
      { input }
    );
    revalidate(locale, projectId);
    return { success: true as const, data: updateTask };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const moveTaskAction = async (input: {
  id: string;
  projectId: string;
  status: TaskStatus;
  orderedTaskIds: string[];
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { moveTask } = await client.request<{
      moveTask: { id: string; status: TaskStatus; sortOrder: number };
    }>(MoveDocument, {
      input: {
        id: input.id,
        status: input.status,
        orderedTaskIds: input.orderedTaskIds,
      },
    });
    revalidate(locale, input.projectId);
    return { success: true as const, data: moveTask };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const deleteTaskAction = async (
  id: string,
  projectId?: string | null
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { deleteTask } = await client.request<{ deleteTask: boolean }>(
      DeleteDocument,
      { id }
    );
    revalidate(locale, projectId);
    return { success: true as const, data: deleteTask };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

/** Form checklist → TaskChecklistItemInput[] (drops empty ids so the backend creates new items). */
function toChecklistInput(values: TaskFormOutput) {
  return (values.checklist ?? []).map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    label: item.label,
    done: item.done,
  }));
}

/** Date → ISO date string (YYYY-MM-DD) without timezone drift. */
function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
