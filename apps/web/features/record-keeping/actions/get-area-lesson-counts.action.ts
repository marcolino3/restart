"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

export type AreaLessonCount = {
  areaId: string;
  lessonCount: number;
  curriculumId?: string | null;
  curriculumName?: string | null;
};

type Response = {
  areaLessonCountsByOrg: AreaLessonCount[];
};

const Document = gql`
  query GetAreaLessonCounts {
    areaLessonCountsByOrg {
      areaId
      lessonCount
      curriculumId
      curriculumName
    }
  }
`;

export const getAreaLessonCountsAction = async (): Promise<
  { success: true; data: AreaLessonCount[] } | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { areaLessonCountsByOrg } = await client.request<Response>(Document);
    return { success: true as const, data: areaLessonCountsByOrg };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load area lesson counts" };
  }
};
