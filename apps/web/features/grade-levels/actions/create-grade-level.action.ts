"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const CreateGradeLevelDocument = gql`
  mutation CreateGradeLevel($input: CreateGradeLevelInput!) {
    createGradeLevel(input: $input) {
      id
      name
      color
      shortCode
      ageMin
      ageMax
      sortOrder
    }
  }
`;

type CreateGradeLevelResponse = {
  createGradeLevel: {
    id: string;
    name: string;
    color: string | null;
    shortCode: string | null;
    ageMin: number | null;
    ageMax: number | null;
    sortOrder: number;
  };
};

export type CreateGradeLevelActionInput = {
  name: string;
  color?: string | null;
  shortCode?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
};

export const createGradeLevelAction = async (
  input: CreateGradeLevelActionInput,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { createGradeLevel } = await client.request<CreateGradeLevelResponse>(
      CreateGradeLevelDocument,
      {
        input: {
          name: input.name,
          ...(input.color ? { color: input.color } : {}),
          shortCode: input.shortCode ?? null,
          ageMin: input.ageMin ?? null,
          ageMax: input.ageMax ?? null,
        },
      },
    );
    revalidatePath(`/${locale}/admin/grade-levels`);
    revalidatePath(`/${locale}/admin/school-classes`);
    return { success: true as const, data: createGradeLevel };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
