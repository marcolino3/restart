"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { invalidateCurriculumCache } from "../lib/invalidate-curriculum-cache";
import type {
  CurriculumDTO,
  CurriculumTranslationDTO,
} from "../types";

type Input = {
  id: string;
  slug?: string;
  translations?: CurriculumTranslationDTO[];
};

type Response = { updateCurriculum: CurriculumDTO };

const Document = gql`
  mutation UpdateCurriculum($input: UpdateCurriculumInput!) {
    updateCurriculum(input: $input) {
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

export const updateCurriculumAction = async (input: Input) => {
  const client = await serverCookieGqlClient();
  try {
    const { updateCurriculum } = await client.request<Response>(Document, {
      input,
    });
    await invalidateCurriculumCache();
    return { success: true as const, data: updateCurriculum };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
