"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

export type CreateEmployeeNoteInput = {
  employeeId: string;
  category: string;
  title: string;
  content: string;
  isConfidential?: boolean;
  date?: string;
};

const CreateEmployeeNoteDocument = gql`
  mutation CreateEmployeeNote(
    $createEmployeeNoteInput: CreateEmployeeNoteInput!
  ) {
    createEmployeeNote(createEmployeeNoteInput: $createEmployeeNoteInput) {
      id
    }
  }
`;

export const createEmployeeNoteAction = async (
  input: CreateEmployeeNoteInput,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { createEmployeeNote } = await client.request<{
      createEmployeeNote: { id: string };
    }>(CreateEmployeeNoteDocument, {
      createEmployeeNoteInput: {
        employeeId: input.employeeId,
        category: input.category,
        title: input.title,
        content: input.content,
        isConfidential: input.isConfidential ?? false,
        ...(input.date ? { date: input.date } : {}),
      },
    });
    revalidatePath(`/${locale}/admin/employees`);
    return { success: true as const, data: createEmployeeNote };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to create note" };
  }
};
