"use server";

import {
  UpdateSchoolClassFormSchema,
  UpdateSchoolClassFormType,
} from "../schemas/update-school-class-form.schema";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const UpdateSchoolClassDocument = gql`
  mutation UpdateSchoolClass($input: UpdateSchoolClassInput!) {
    updateSchoolClass(input: $input) {
      id
    }
  }
`;

export const updateSchoolClassAction = async (
  values: UpdateSchoolClassFormType
) => {
  const locale = await getLocale();
  const parsed = UpdateSchoolClassFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const input = {
    id: parsed.id,
    name: parsed.name,
    shortCode: parsed.shortCode || null,
    gradeLevelIds: parsed.gradeLevelIds ?? [],
    // Always sent, and `teacherIds` deliberately is not: the backend gives
    // `teachers` precedence, and an empty array means "no teachers left",
    // which is how removing the last one is expressed.
    teachers: (parsed.teachers ?? []).map((t) => ({
      employeeId: t.employeeId,
      role: t.role,
      workloadPercent:
        typeof t.workloadPercent === "number" ? t.workloadPercent : null,
    })),
    color: parsed.color || null,
    description: parsed.description || null,
    // maxCapacity is `number | "" | undefined` after parsing; the schema
    // already coerces numeric strings, so only a real number is sent.
    maxCapacity:
      typeof parsed.maxCapacity === "number" ? parsed.maxCapacity : null,
    room: parsed.room || null,
  };

  try {
    const { updateSchoolClass } = await client.request<{
      updateSchoolClass: { id: string };
    }>(UpdateSchoolClassDocument, { input });
    revalidatePath(`/${locale}/admin/school-classes`);
    return { success: true as const, data: updateSchoolClass };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to update school class" };
  }
};
