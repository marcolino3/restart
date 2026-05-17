"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { invalidateCurriculumCache } from "../lib/invalidate-curriculum-cache";

type Response = { archiveCurriculum: boolean };

const Document = gql`
  mutation ArchiveCurriculum($id: ID!) {
    archiveCurriculum(id: $id)
  }
`;

export const archiveCurriculumAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { archiveCurriculum } = await client.request<Response>(Document, {
      id,
    });
    await invalidateCurriculumCache();
    return { success: archiveCurriculum, data: archiveCurriculum } as const;
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
