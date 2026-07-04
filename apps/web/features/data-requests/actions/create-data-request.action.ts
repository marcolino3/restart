"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";
import {
  DataRequestFormSchema,
  type DataRequestFormType,
} from "../schemas/data-request-form.schema";

const CreateDataRequestDocument = gql`
  mutation CreateDataSubjectRequest($input: CreateDataSubjectRequestInput!) {
    createDataSubjectRequest(input: $input) {
      id
    }
  }
`;

type Response = { createDataSubjectRequest: { id: string } };

export const createDataRequestAction = async (values: DataRequestFormType) => {
  const locale = await getLocale();
  const parsed = DataRequestFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const input = {
    type: parsed.type,
    subjectType: parsed.subjectType,
    subjectName: parsed.subjectName,
    ...(parsed.contactEmail ? { contactEmail: parsed.contactEmail } : {}),
    ...(parsed.receivedAt
      ? { receivedAt: parsed.receivedAt.toISOString().split("T")[0] }
      : {}),
    ...(parsed.notes ? { notes: parsed.notes } : {}),
  };

  try {
    const { createDataSubjectRequest } = await client.request<Response>(
      CreateDataRequestDocument,
      { input },
    );
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: createDataSubjectRequest };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
