"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { CurriculumDTO } from "../types";

type Response = { unarchiveCurriculum: CurriculumDTO };

const Document = gql`
  mutation UnarchiveCurriculum($id: ID!) {
    unarchiveCurriculum(id: $id) {
      id
      isArchived
    }
  }
`;

export const unarchiveCurriculumAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { unarchiveCurriculum } = await client.request<Response>(Document, {
      id,
    });
    return { success: true as const, data: unarchiveCurriculum };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
