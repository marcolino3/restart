"use server";

import { graphql } from "@restart/shared-types";
import {
  CreateConversationMutation,
  ConversationType,
} from "@restart/shared-types/graphql";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const CreateConversationDocument = graphql(`
  mutation CreateConversation($input: CreateConversationInput!) {
    createConversation(input: $input) {
      id
      type
      name
    }
  }
`);

export async function createConversationAction(input: {
  type: ConversationType;
  name?: string | null;
  participantMembershipIds?: string[];
  teamId?: string | null;
}) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createConversation } =
      await client.request<CreateConversationMutation>(
        CreateConversationDocument,
        { input },
      );
    revalidatePath(ROUTES.admin.chats(locale));
    return { success: true as const, data: createConversation };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
