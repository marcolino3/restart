"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type {
  CurriculumDTO,
  CurriculumTranslationDTO,
} from "../types";

type Input = {
  slug: string;
  translations: CurriculumTranslationDTO[];
};

type Response = { createCurriculum: CurriculumDTO };

const Document = gql`
  mutation CreateCurriculum($input: CreateCurriculumInput!) {
    createCurriculum(input: $input) {
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

export const createCurriculumAction = async (input: Input) => {
  const client = await serverCookieGqlClient();
  try {
    const { createCurriculum } = await client.request<Response>(Document, {
      input,
    });
    return { success: true as const, data: createCurriculum };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
