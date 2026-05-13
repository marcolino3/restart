"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { CurriculumDTO } from "../types";

type Response = { curriculumById: CurriculumDTO };

const Document = gql`
  query GetCurriculumById($id: ID!) {
    curriculumById(id: $id) {
      id
      slug
      position
      isArchived
      translations {
        locale
        name
        description
      }
    }
  }
`;

export const getCurriculumByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { curriculumById } = await client.request<Response>(Document, { id });
    return { success: true as const, data: curriculumById };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
