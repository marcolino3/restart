"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import { gql } from "graphql-request";

const UnlinkContactPersonFromStudentDocument = gql`
  mutation UnlinkContactPersonFromStudent($id: ID!) {
    unlinkContactPersonFromStudent(id: $id)
  }
`;

export const unlinkContactPersonFromStudentAction = async (
  linkId: string,
  studentId: string,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    await client.request(UnlinkContactPersonFromStudentDocument, {
      id: linkId,
    });
    revalidatePath(ROUTES.admin.studentsEdit(locale, studentId));
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
