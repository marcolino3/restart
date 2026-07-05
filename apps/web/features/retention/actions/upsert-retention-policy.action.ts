"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";
import type {
  RetentionAction,
  RetentionEntityType,
} from "../schemas/retention-policy-form.schema";

const UpsertRetentionPolicyDocument = gql`
  mutation UpsertRetentionPolicy($input: UpsertRetentionPolicyInput!) {
    upsertRetentionPolicy(input: $input) {
      id
    }
  }
`;

type Response = { upsertRetentionPolicy: { id: string } };

export type UpsertRetentionArgs = {
  entityType: RetentionEntityType;
  retentionMonths: number;
  action?: RetentionAction;
  description?: string;
  isEnabled?: boolean;
};

export const upsertRetentionPolicyAction = async (
  args: UpsertRetentionArgs,
) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { upsertRetentionPolicy } = await client.request<Response>(
      UpsertRetentionPolicyDocument,
      { input: args },
    );
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: upsertRetentionPolicy };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
