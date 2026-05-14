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
    }
  }
`;

export const createGradeLevelAction = async (name: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { createGradeLevel } = await client.request<{
      createGradeLevel: { id: string; name: string };
    }>(CreateGradeLevelDocument, { input: { name } });
    revalidatePath(`/${locale}/admin/school-classes`);
    return { success: true as const, data: createGradeLevel };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
