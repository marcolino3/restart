"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { TaskStatus } from "../types";

type Response = { updateTask: { id: string; status: TaskStatus } };

// UpdateTaskInput fields are optional (PartialType): sending only id + status
// changes just the status, leaving everything else untouched.
const Document = gql`
  mutation UpdateTaskStatus($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
      status
    }
  }
`;

/** Lightweight status change used by the "My Tasks" list (quick "abarbeiten"). */
export const updateTaskStatusAction = async (
  id: string,
  status: TaskStatus,
  projectId?: string
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateTask } = await client.request<Response>(Document, {
      input: { id, status },
    });
    revalidatePath(ROUTES.admin.myTasks(locale));
    if (projectId) revalidatePath(ROUTES.admin.projectsBoard(locale, projectId));
    return { success: true as const, data: updateTask };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
