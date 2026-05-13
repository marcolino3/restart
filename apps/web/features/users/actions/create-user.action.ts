"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  CreateUserFormSchema,
  CreateUserFormType,
} from "../schemas/create-user-form.schema";

const CreateUserDocument = gql`
  mutation CreateUser($createUserInput: CreateUserInput!) {
    createUser(createUserInput: $createUserInput) {
      id
    }
  }
`;

export const createUserAction = async (values: CreateUserFormType) => {
  const locale = await getLocale();
  const parsed = CreateUserFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  try {
    const { createUser } = await client.request<{
      createUser: { id: string };
    }>(CreateUserDocument, {
      createUserInput: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        password: parsed.password || undefined,
        title: parsed.title || undefined,
        organizationId: parsed.organizationId,
        persona: parsed.persona,
        roleIds: parsed.roleIds,
      },
    });
    revalidatePath(`/${locale}/admin/users`);
    return { success: true as const, data: createUser };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to create user" };
  }
};
