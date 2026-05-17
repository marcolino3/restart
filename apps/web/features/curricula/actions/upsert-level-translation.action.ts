"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import { invalidateCurriculumCache } from "../lib/invalidate-curriculum-cache";
import type { CurriculumLocale } from "../types";

type Input = {
  curriculumLevelId: string;
  locale: CurriculumLocale;
  name: string;
};

type Response = {
  upsertCurriculumLevelTranslation: {
    locale: CurriculumLocale;
    name: string;
  };
};

const Document = gql`
  mutation UpsertCurriculumLevelTranslation(
    $input: UpsertCurriculumLevelTranslationInput!
  ) {
    upsertCurriculumLevelTranslation(input: $input) {
      locale
      name
    }
  }
`;

export const upsertCurriculumLevelTranslationAction = async (
  input: Input,
  curriculumId?: string,
) => {
  const [client, uiLocale] = await Promise.all([
    serverCookieGqlClient(),
    getLocale(),
  ]);
  try {
    const { upsertCurriculumLevelTranslation } = await client.request<Response>(
      Document,
      { input },
    );
    await invalidateCurriculumCache();
    if (curriculumId) {
      revalidatePath(`/${uiLocale}/admin/curricula/edit/${curriculumId}`);
    }
    return { success: true as const, data: upsertCurriculumLevelTranslation };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
