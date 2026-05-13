"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { CurriculumDTO } from "../types";

type Response = { curricula: CurriculumDTO[] };

const Document = gql`
  query GetCurricula($includeArchived: Boolean) {
    curricula(includeArchived: $includeArchived) {
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

export const getCurriculaAction = async (includeArchived = false) => {
  const client = await serverCookieGqlClient();
  try {
    const { curricula } = await client.request<Response>(Document, {
      includeArchived,
    });
    return { success: true as const, data: curricula };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
