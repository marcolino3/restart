"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { ProtocolSections, ProtocolStatus } from "../types";

const CreateDocument = gql`
  mutation CreateProtocol($input: CreateProtocolInput!) {
    createProtocol(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateProtocol($input: UpdateProtocolInput!) {
    updateProtocol(input: $input) {
      id
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteProtocol($id: ID!) {
    deleteProtocol(id: $id)
  }
`;

export const createProtocolAction = async (input: {
  title: string;
  meetingDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  // Applies a protocol template (copies agenda items + default participants).
  templateId?: string | null;
  status?: ProtocolStatus;
  projectId?: string | null;
  participantMembershipIds?: string[];
  externalParticipants?: string[];
  sections?: ProtocolSections;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createProtocol } = await client.request<{
      createProtocol: { id: string };
    }>(CreateDocument, { input });
    revalidatePath(ROUTES.admin.protocols(locale));
    return { success: true as const, data: createProtocol };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const updateProtocolAction = async (input: {
  id: string;
  title?: string;
  meetingDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: ProtocolStatus;
  projectId?: string | null;
  externalParticipants?: string[];
  participantMembershipIds?: string[];
  sections?: ProtocolSections;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateProtocol } = await client.request<{
      updateProtocol: { id: string };
    }>(UpdateDocument, { input });
    revalidatePath(ROUTES.admin.protocols(locale));
    revalidatePath(ROUTES.admin.protocolEditor(locale, input.id));
    return { success: true as const, data: updateProtocol };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const deleteProtocolAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { deleteProtocol } = await client.request<{
      deleteProtocol: boolean;
    }>(DeleteDocument, { id });
    revalidatePath(ROUTES.admin.protocols(locale));
    return { success: true as const, data: deleteProtocol };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
