"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

export type CreateStudentNoteInput = {
  studentId: string;
  category: string;
  title: string;
  content: string;
  isConfidential?: boolean;
  date?: string;
};

const CreateStudentNoteDocument = gql`
  mutation CreateStudentNote(
    $createStudentNoteInput: CreateStudentNoteInput!
  ) {
    createStudentNote(createStudentNoteInput: $createStudentNoteInput) {
      id
    }
  }
`;

export const createStudentNoteAction = async (
  input: CreateStudentNoteInput,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { createStudentNote } = await client.request<{
      createStudentNote: { id: string };
    }>(CreateStudentNoteDocument, {
      createStudentNoteInput: {
        studentId: input.studentId,
        category: input.category,
        title: input.title,
        content: input.content,
        isConfidential: input.isConfidential ?? false,
        ...(input.date ? { date: input.date } : {}),
      },
    });
    revalidatePath(`/${locale}/admin/students`);
    return { success: true as const, data: createStudentNote };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to create note" };
  }
};
