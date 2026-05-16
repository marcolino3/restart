"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type {
  CurriculumDTO,
  CurriculumLocale,
  CurriculumNodeType,
  ImportPlan,
} from "../types";

type ImportPlanTranslationInput = {
  locale: CurriculumLocale;
  name: string;
  notes?: string | null;
};

type ImportPlanNodeInput = {
  nodeType: CurriculumNodeType;
  position: number;
  translations: ImportPlanTranslationInput[];
  children: ImportPlanNodeInput[];
};

type ImportPlanLevelInput = {
  slug: string;
  position: number;
  translations: ImportPlanTranslationInput[];
  roots: ImportPlanNodeInput[];
};

type Input = {
  curriculumSlug: string;
  curriculumPosition?: number;
  curriculumTranslations: ImportPlanTranslationInput[];
  levels: ImportPlanLevelInput[];
};

type Response = { importCurriculumFromPlan: CurriculumDTO };

const Document = gql`
  mutation ImportCurriculumFromPlan($input: ImportCurriculumPlanInput!) {
    importCurriculumFromPlan(input: $input) {
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

function stripPlanForCommit(plan: ImportPlan, curriculumSlug: string): Input {
  const translations: ImportPlanTranslationInput[] = plan.levels[0]
    ? plan.levels[0].translations.map((t) => ({
        locale: t.locale,
        name: t.name,
      }))
    : [{ locale: plan.sourceLocale, name: curriculumSlug }];

  const stripNode = (
    n: ImportPlan["levels"][number]["roots"][number],
  ): ImportPlanNodeInput => ({
    nodeType: n.nodeType,
    position: n.position,
    translations: n.translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      notes: t.notes ?? null,
    })),
    children: n.children.map(stripNode),
  });

  return {
    curriculumSlug,
    curriculumTranslations: translations,
    levels: plan.levels.map((lvl) => ({
      slug: lvl.slug,
      position: lvl.position,
      translations: lvl.translations.map((t) => ({
        locale: t.locale,
        name: t.name,
      })),
      roots: lvl.roots.map(stripNode),
    })),
  };
}

export const importCurriculumFromPlanAction = async (
  plan: ImportPlan,
  curriculumSlug: string,
  curriculumName: string,
) => {
  const input = stripPlanForCommit(plan, curriculumSlug);
  input.curriculumTranslations = [
    { locale: plan.sourceLocale, name: curriculumName },
  ];
  const [client, locale] = await Promise.all([
    serverCookieGqlClient(),
    getLocale(),
  ]);
  try {
    const { importCurriculumFromPlan } = await client.request<Response>(
      Document,
      { input },
    );
    revalidatePath(`/${locale}/admin/curricula`);
    revalidatePath(
      `/${locale}/admin/curricula/edit/${importCurriculumFromPlan.id}`,
    );
    return { success: true as const, data: importCurriculumFromPlan };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
