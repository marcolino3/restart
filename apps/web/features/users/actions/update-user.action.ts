"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  UpdateUserFormSchema,
  UpdateUserFormType,
} from "../schemas/update-user-form.schema";

const UpdateUserDocument = gql`
  mutation UpdateUser($updateUserInput: UpdateUserInput!) {
    updateUser(updateUserInput: $updateUserInput) {
      id
    }
  }
`;

export const updateUserAction = async (values: UpdateUserFormType) => {
  const locale = await getLocale();
  const parsed = UpdateUserFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  try {
    const { updateUser } = await client.request<{
      updateUser: { id: string };
    }>(UpdateUserDocument, {
      updateUserInput: {
        id: parsed.id,
        title: parsed.title || undefined,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        dateOfBirth: parsed.dateOfBirth
          ? parsed.dateOfBirth.toISOString().split("T")[0]
          : undefined,
        socialSecurityNumber: parsed.socialSecurityNumber || undefined,
      },
    });
    revalidatePath(`/${locale}/admin/users`);
    return { success: true as const, data: updateUser };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to update user" };
  }
};
