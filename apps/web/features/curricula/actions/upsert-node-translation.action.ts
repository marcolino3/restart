"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { invalidateCurriculumCache } from "../lib/invalidate-curriculum-cache";
import type {
  CurriculumLocale,
  CurriculumNodeTranslationDTO,
} from "../types";

type Input = {
  curriculumNodeId: string;
  locale: CurriculumLocale;
  name: string;
  notes?: string;
};

type Response = {
  upsertCurriculumNodeTranslation: CurriculumNodeTranslationDTO;
};

const Document = gql`
  mutation UpsertCurriculumNodeTranslation(
    $input: UpsertCurriculumNodeTranslationInput!
  ) {
    upsertCurriculumNodeTranslation(input: $input) {
      locale
      name
      notes
    }
  }
`;

export const upsertCurriculumNodeTranslationAction = async (input: Input) => {
  const client = await serverCookieGqlClient();
  try {
    const { upsertCurriculumNodeTranslation } = await client.request<Response>(
      Document,
      { input },
    );
    await invalidateCurriculumCache();
    return { success: true as const, data: upsertCurriculumNodeTranslation };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
