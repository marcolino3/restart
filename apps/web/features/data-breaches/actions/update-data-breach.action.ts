"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";
import type { DataBreachStatus } from "../schemas/data-breach-form.schema";

const UpdateDataBreachDocument = gql`
  mutation UpdateDataBreach($input: UpdateDataBreachInput!) {
    updateDataBreach(input: $input) {
      id
      status
    }
  }
`;

type Response = {
  updateDataBreach: { id: string; status: DataBreachStatus };
};

export type UpdateDataBreachArgs = {
  id: string;
  status?: DataBreachStatus;
  authorityNotified?: boolean;
  subjectsNotified?: boolean;
  measures?: string;
  assigneeMembershipId?: string;
};

export const updateDataBreachAction = async (args: UpdateDataBreachArgs) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { updateDataBreach } = await client.request<Response>(
      UpdateDataBreachDocument,
      { input: args },
    );
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: updateDataBreach };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
