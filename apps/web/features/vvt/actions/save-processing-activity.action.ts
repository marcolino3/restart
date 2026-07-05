"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";
import {
  ProcessingActivityFormSchema,
  type ProcessingActivityFormType,
} from "../schemas/vvt-form.schema";

const CreateDoc = gql`
  mutation CreateProcessingActivity($input: CreateProcessingActivityInput!) {
    createProcessingActivity(input: $input) {
      id
    }
  }
`;
const UpdateDoc = gql`
  mutation UpdateProcessingActivity($input: UpdateProcessingActivityInput!) {
    updateProcessingActivity(input: $input) {
      id
    }
  }
`;

export const saveProcessingActivityAction = async (
  values: ProcessingActivityFormType,
  id?: string,
) => {
  const locale = await getLocale();
  const parsed = ProcessingActivityFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const input = {
    name: parsed.name,
    legalBasis: parsed.legalBasis,
    ...(parsed.purpose ? { purpose: parsed.purpose } : {}),
    ...(parsed.dataCategories ? { dataCategories: parsed.dataCategories } : {}),
    ...(parsed.dataSubjects ? { dataSubjects: parsed.dataSubjects } : {}),
    ...(parsed.recipients ? { recipients: parsed.recipients } : {}),
    ...(parsed.retentionNote ? { retentionNote: parsed.retentionNote } : {}),
  };

  try {
    if (id) {
      await client.request(UpdateDoc, { input: { id, ...input } });
    } else {
      await client.request(CreateDoc, { input });
    }
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: null };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
