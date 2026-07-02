"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { TaskPriority } from "../types";

type Draft = {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeMembershipIds?: string[];
};

const Document = gql`
  mutation CreateTasksFromProtocol($input: CreateTasksFromProtocolInput!) {
    createTasksFromProtocol(input: $input) {
      id
    }
  }
`;

/** Turn protocol todos into real tasks (assigned → appear in My Tasks). */
export const createTasksFromProtocolAction = async (
  protocolId: string,
  tasks: Draft[]
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createTasksFromProtocol } = await client.request<{
      createTasksFromProtocol: { id: string }[];
    }>(Document, { input: { protocolId, tasks } });
    revalidatePath(ROUTES.admin.myTasks(locale));
    revalidatePath(ROUTES.admin.protocols(locale));
    return { success: true as const, data: createTasksFromProtocol };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
