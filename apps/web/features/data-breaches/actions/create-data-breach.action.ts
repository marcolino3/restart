"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";
import {
  DataBreachFormSchema,
  type DataBreachFormType,
} from "../schemas/data-breach-form.schema";

const CreateDataBreachDocument = gql`
  mutation CreateDataBreach($input: CreateDataBreachInput!) {
    createDataBreach(input: $input) {
      id
    }
  }
`;

type Response = { createDataBreach: { id: string } };

export const createDataBreachAction = async (values: DataBreachFormType) => {
  const locale = await getLocale();
  const parsed = DataBreachFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const input = {
    title: parsed.title,
    description: parsed.description,
    riskLevel: parsed.riskLevel,
    ...(parsed.detectedAt ? { detectedAt: parsed.detectedAt.toISOString() } : {}),
    ...(parsed.affectedScope ? { affectedScope: parsed.affectedScope } : {}),
    ...(typeof parsed.affectedCount === "number"
      ? { affectedCount: parsed.affectedCount }
      : {}),
    ...(parsed.notes ? { notes: parsed.notes } : {}),
  };

  try {
    const { createDataBreach } = await client.request<Response>(
      CreateDataBreachDocument,
      { input },
    );
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: createDataBreach };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
