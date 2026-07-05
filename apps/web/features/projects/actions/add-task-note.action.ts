"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

const Document = gql`
  mutation AddTaskNote($input: AddTaskNoteInput!) {
    addTaskNote(input: $input) {
      id
      notes {
        id
        text
        authorName
        createdAt
      }
    }
  }
`;

type Response = {
  addTaskNote: {
    id: string;
    notes: {
      id: string;
      text: string;
      authorName?: string | null;
      createdAt: string;
    }[];
  };
};

export const addTaskNoteAction = async (
  taskId: string,
  text: string,
  projectId?: string | null
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { addTaskNote } = await client.request<Response>(Document, {
      input: { taskId, text },
    });
    if (projectId) {
      revalidatePath(ROUTES.admin.projectsBoard(locale, projectId));
    }
    revalidatePath(ROUTES.admin.myTasks(locale));
    return { success: true as const, data: addTaskNote };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
