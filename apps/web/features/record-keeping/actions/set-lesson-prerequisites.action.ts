"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type SetLessonPrerequisitesInput = {
  lessonId: string;
  prerequisiteIds: string[];
};

type Response = {
  setLessonPrerequisites: { id: string };
};

const Document = gql`
  mutation SetLessonPrerequisites($input: SetLessonPrerequisitesInput!) {
    setLessonPrerequisites(input: $input) {
      id
    }
  }
`;

export const setLessonPrerequisitesAction = async (
  input: SetLessonPrerequisitesInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { setLessonPrerequisites } = await client.request<Response>(
      Document,
      { input },
    );
    return { success: true as const, data: setLessonPrerequisites };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
