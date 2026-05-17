"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { CurriculumNodeType, LessonTranslationDTO } from "../types";

export type AreaOption = {
  id: string;
  position: number;
  nodeType: CurriculumNodeType;
  translations: LessonTranslationDTO[];
};

type Response = {
  areasByOrg: Array<{
    id: string;
    position: number;
    nodeType: string;
    translations: { locale: string; name: string }[];
  }>;
};

const Document = gql`
  query GetOrgAreas {
    areasByOrg(includeArchived: false) {
      id
      position
      nodeType
      translations {
        locale
        name
      }
    }
  }
`;

export const getOrgAreasAction = async (): Promise<
  | { success: true; data: AreaOption[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { areasByOrg } = await client.request<Response>(Document);
    return {
      success: true as const,
      data: areasByOrg.map((a) => ({
        id: a.id,
        position: a.position,
        nodeType: a.nodeType as CurriculumNodeType,
        translations: a.translations.map((t) => ({
          locale: t.locale as LessonTranslationDTO["locale"],
          name: t.name,
        })),
      })),
    };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load areas" };
  }
};
