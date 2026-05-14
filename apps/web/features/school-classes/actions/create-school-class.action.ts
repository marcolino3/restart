"use server";

import {
  CreateSchoolClassFormSchema,
  CreateSchoolClassFormOutput,
} from "../schemas/create-school-class-form.schema";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const CreateSchoolClassDocument = gql`
  mutation CreateSchoolClass($input: CreateSchoolClassInput!) {
    createSchoolClass(input: $input) {
      id
    }
  }
`;

type CreateSchoolClassResponse = {
  createSchoolClass: { id: string };
};

export const createSchoolClassAction = async (
  values: CreateSchoolClassFormOutput
) => {
  const locale = await getLocale();
  const parsed = CreateSchoolClassFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const input = {
    name: parsed.name,
    sortOrder: parsed.sortOrder,
    ...(parsed.gradeLevelIds?.length
      ? { gradeLevelIds: parsed.gradeLevelIds }
      : {}),
    ...(parsed.color ? { color: parsed.color } : {}),
    ...(parsed.description ? { description: parsed.description } : {}),
    ...(parsed.maxCapacity && parsed.maxCapacity !== ""
      ? { maxCapacity: Number(parsed.maxCapacity) }
      : {}),
    ...(parsed.room ? { room: parsed.room } : {}),
  };

  try {
    const { createSchoolClass } =
      await client.request<CreateSchoolClassResponse>(
        CreateSchoolClassDocument,
        { input }
      );
    revalidatePath(ROUTES.admin.schoolClasses(locale));
    return { success: true as const, data: createSchoolClass };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
