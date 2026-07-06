"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { AgendaItem, ProtocolTemplate } from "../types";

const CreateDocument = gql`
  mutation CreateProtocolTemplate($input: CreateProtocolTemplateInput!) {
    createProtocolTemplate(input: $input) {
      id
      title
      agendaItems {
        no
        topic
        goal
      }
      defaultParticipantMembershipIds
      usedCount
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateProtocolTemplate($input: UpdateProtocolTemplateInput!) {
    updateProtocolTemplate(input: $input) {
      id
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteProtocolTemplate($id: ID!) {
    deleteProtocolTemplate(id: $id)
  }
`;

const SaveAsTemplateDocument = gql`
  mutation SaveProtocolAsTemplate($input: SaveProtocolAsTemplateInput!) {
    saveProtocolAsTemplate(input: $input) {
      id
    }
  }
`;

export const createProtocolTemplateAction = async (input: {
  title: string;
  agendaItems?: AgendaItem[];
  defaultParticipantMembershipIds?: string[];
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createProtocolTemplate } = await client.request<{
      createProtocolTemplate: ProtocolTemplate;
    }>(CreateDocument, { input });
    revalidatePath(ROUTES.admin.protocols(locale));
    return { success: true as const, data: createProtocolTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const updateProtocolTemplateAction = async (input: {
  id: string;
  title?: string;
  agendaItems?: AgendaItem[];
  defaultParticipantMembershipIds?: string[];
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateProtocolTemplate } = await client.request<{
      updateProtocolTemplate: { id: string };
    }>(UpdateDocument, { input });
    revalidatePath(ROUTES.admin.protocols(locale));
    return { success: true as const, data: updateProtocolTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const deleteProtocolTemplateAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { deleteProtocolTemplate } = await client.request<{
      deleteProtocolTemplate: boolean;
    }>(DeleteDocument, { id });
    revalidatePath(ROUTES.admin.protocols(locale));
    return { success: true as const, data: deleteProtocolTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const saveProtocolAsTemplateAction = async (input: {
  protocolId: string;
  title: string;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { saveProtocolAsTemplate } = await client.request<{
      saveProtocolAsTemplate: { id: string };
    }>(SaveAsTemplateDocument, { input });
    revalidatePath(ROUTES.admin.protocols(locale));
    return { success: true as const, data: saveProtocolAsTemplate };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
