"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

type Response = { reorderMyTasks: boolean };

const Document = gql`
  mutation ReorderMyTasks($orderedTaskIds: [ID!]!) {
    reorderMyTasks(orderedTaskIds: $orderedTaskIds)
  }
`;

/** Persist the caller's personal drag-and-drop order of their assigned tasks. */
export const reorderMyTasksAction = async (orderedTaskIds: string[]) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { reorderMyTasks } = await client.request<Response>(Document, {
      orderedTaskIds,
    });
    revalidatePath(ROUTES.admin.myTasks(locale));
    return { success: true as const, data: reorderMyTasks };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
