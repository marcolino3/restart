"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";

export type StudentRecordEntry = {
  id: string;
  studentId: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  title: string | null;
  content: string | null;
  occurredAt: string;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
  authorMembershipId: string | null;
  authorName: string | null;
};

const revalidateStudent = (studentId: string) =>
  revalidatePath(`/[locale]/admin/students/${studentId}`, "page");

const ListDocument = gql`
  query StudentRecordEntries($studentId: ID!) {
    studentRecordEntries(studentId: $studentId) {
      id
      studentId
      categoryId
      category {
        id
        name
        color
      }
      title
      content
      occurredAt
      isConfidential
      createdAt
      updatedAt
      authorMembershipId
      authorMembership {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

type RawEntry = {
  id: string;
  studentId: string;
  categoryId: string | null;
  category: { id: string; name: string; color: string | null } | null;
  title: string | null;
  content: string | null;
  occurredAt: string;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
  authorMembershipId: string | null;
  authorMembership: {
    id: string;
    user?: { firstName: string; lastName: string } | null;
  } | null;
};

const mapEntry = (e: RawEntry): StudentRecordEntry => ({
  id: e.id,
  studentId: e.studentId,
  categoryId: e.categoryId,
  categoryName: e.category?.name ?? null,
  categoryColor: e.category?.color ?? null,
  title: e.title,
  content: e.content,
  occurredAt: e.occurredAt,
  isConfidential: e.isConfidential,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
  authorMembershipId: e.authorMembershipId,
  authorName: e.authorMembership?.user
    ? `${e.authorMembership.user.firstName} ${e.authorMembership.user.lastName}`.trim()
    : null,
});

export const getStudentRecordEntriesAction = async (
  studentId: string,
): Promise<
  | { success: true; data: StudentRecordEntry[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{ studentRecordEntries: RawEntry[] }>(
      ListDocument,
      { studentId },
    );
    return { success: true, data: resp.studentRecordEntries.map(mapEntry) };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load entries",
    };
  }
};

export type CreateStudentRecordEntryInput = {
  studentId: string;
  categoryId?: string | null;
  title?: string | null;
  content?: string | null;
  occurredAt: string;
  isConfidential?: boolean;
};

const CreateDocument = gql`
  mutation CreateStudentRecordEntry($input: CreateStudentRecordEntryInput!) {
    createStudentRecordEntry(input: $input) {
      id
    }
  }
`;

export const createStudentRecordEntryAction = async (
  input: CreateStudentRecordEntryInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      createStudentRecordEntry: { id: string };
    }>(CreateDocument, {
      input: {
        studentId: input.studentId,
        categoryId: input.categoryId ?? null,
        title: input.title ?? null,
        content: input.content ?? null,
        occurredAt: input.occurredAt,
        isConfidential: input.isConfidential ?? null,
      },
    });
    revalidateStudent(input.studentId);
    return { success: true, id: resp.createStudentRecordEntry.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export type UpdateStudentRecordEntryInput = {
  id: string;
  studentId: string;
  categoryId?: string | null;
  title?: string | null;
  content?: string | null;
  occurredAt?: string;
  isConfidential?: boolean;
};

const UpdateDocument = gql`
  mutation UpdateStudentRecordEntry($input: UpdateStudentRecordEntryInput!) {
    updateStudentRecordEntry(input: $input) {
      id
    }
  }
`;

export const updateStudentRecordEntryAction = async (
  input: UpdateStudentRecordEntryInput,
): Promise<{ success: true } | { success: false; error: string }> => {
  const client = await serverCookieGqlClient();
  try {
    const { studentId, ...rest } = input;
    await client.request(UpdateDocument, { input: rest });
    revalidateStudent(studentId);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

const DeleteDocument = gql`
  mutation DeleteStudentRecordEntry($id: ID!) {
    deleteStudentRecordEntry(id: $id)
  }
`;

export const deleteStudentRecordEntryAction = async (
  id: string,
  studentId: string,
): Promise<{ success: true } | { success: false; error: string }> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    revalidateStudent(studentId);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
};
