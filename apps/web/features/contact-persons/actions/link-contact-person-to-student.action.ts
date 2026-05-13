"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import { gql } from "graphql-request";

const LinkContactPersonToStudentDocument = gql`
  mutation LinkContactPersonToStudent($input: LinkContactPersonInput!) {
    linkContactPersonToStudent(input: $input) {
      id
    }
  }
`;

export type LinkContactPersonValues = {
  studentId: string;
  contactPersonId: string;
  relationshipType: string;
  isPrimaryContact?: boolean;
  hasCustody?: boolean;
  isPickupAuthorized?: boolean;
  emergencyPriority?: number;
  livesWithStudent?: boolean;
  notes?: string;
};

export const linkContactPersonToStudentAction = async (
  values: LinkContactPersonValues,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { linkContactPersonToStudent } = await client.request<{
      linkContactPersonToStudent: { id: string };
    }>(LinkContactPersonToStudentDocument, { input: values });
    revalidatePath(ROUTES.admin.studentsEdit(locale, values.studentId));
    return { success: true as const, data: linkContactPersonToStudent };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
