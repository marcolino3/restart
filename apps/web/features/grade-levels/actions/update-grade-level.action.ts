"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const UpdateGradeLevelDocument = gql`
  mutation UpdateGradeLevel($input: UpdateGradeLevelInput!) {
    updateGradeLevel(input: $input) {
      id
      name
      parentId
      color
      shortCode
      ageMin
      ageMax
      sortOrder
    }
  }
`;

type UpdateGradeLevelResponse = {
  updateGradeLevel: {
    id: string;
    name: string;
    parentId: string | null;
    color: string | null;
    shortCode: string | null;
    ageMin: number | null;
    ageMax: number | null;
    sortOrder: number;
  };
};

export const updateGradeLevelAction = async (input: {
  id: string;
  name?: string;
  parentId?: string | null;
  color?: string | null;
  shortCode?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { updateGradeLevel } = await client.request<UpdateGradeLevelResponse>(
      UpdateGradeLevelDocument,
      { input },
    );
    revalidatePath(`/${locale}/admin/grade-levels`);
    revalidatePath(`/${locale}/admin/school-classes`);
    return { success: true as const, data: updateGradeLevel };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
