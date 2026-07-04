"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";
import type { DataSubjectRequestStatus } from "../schemas/data-request-form.schema";

const UpdateDataRequestDocument = gql`
  mutation UpdateDataSubjectRequest($input: UpdateDataSubjectRequestInput!) {
    updateDataSubjectRequest(input: $input) {
      id
      status
    }
  }
`;

type Response = {
  updateDataSubjectRequest: { id: string; status: DataSubjectRequestStatus };
};

export type UpdateDataRequestArgs = {
  id: string;
  status?: DataSubjectRequestStatus;
  assigneeMembershipId?: string;
  resolutionNote?: string;
};

export const updateDataRequestAction = async (args: UpdateDataRequestArgs) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { updateDataSubjectRequest } = await client.request<Response>(
      UpdateDataRequestDocument,
      { input: args },
    );
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: updateDataSubjectRequest };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
