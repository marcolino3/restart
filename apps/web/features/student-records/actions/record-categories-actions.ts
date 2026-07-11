"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";

export type StudentRecordCategory = {
  id: string;
  name: string;
  color: string | null;
  position: number;
  isArchived: boolean;
};

const CATEGORY_FIELDS = `
  id
  name
  color
  position
  isArchived
`;

const ListDocument = gql`
  query StudentRecordCategories($includeArchived: Boolean) {
    studentRecordCategories(includeArchived: $includeArchived) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const CreateDocument = gql`
  mutation CreateStudentRecordCategory($input: CreateStudentRecordCategoryInput!) {
    createStudentRecordCategory(input: $input) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateStudentRecordCategory($input: UpdateStudentRecordCategoryInput!) {
    updateStudentRecordCategory(input: $input) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const ArchiveDocument = gql`
  mutation ArchiveStudentRecordCategory($id: ID!) {
    archiveStudentRecordCategory(id: $id)
  }
`;

const ReorderDocument = gql`
  mutation ReorderStudentRecordCategories(
    $input: ReorderStudentRecordCategoriesInput!
  ) {
    reorderStudentRecordCategories(input: $input) {
      ${CATEGORY_FIELDS}
    }
  }
`;

/** Revalidates the student detail page after a category change. */
const revalidateStudent = (studentId?: string) => {
  if (studentId) revalidatePath(`/[locale]/admin/students/${studentId}`, "page");
};

export const getStudentRecordCategoriesAction = async (
  includeArchived = false,
): Promise<StudentRecordCategory[]> => {
  const client = await serverCookieGqlClient();
  const { studentRecordCategories } = await client.request<{
    studentRecordCategories: StudentRecordCategory[];
  }>(ListDocument, { includeArchived });
  return studentRecordCategories;
};

export const createStudentRecordCategoryAction = async (
  input: { name: string; color?: string | null; position?: number },
  studentId?: string,
): Promise<
  | { success: true; data: StudentRecordCategory }
  | { success: false; error: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const cleaned = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== null && v !== undefined),
    );
    const { createStudentRecordCategory } = await client.request<{
      createStudentRecordCategory: StudentRecordCategory;
    }>(CreateDocument, { input: cleaned });
    revalidateStudent(studentId);
    return { success: true, data: createStudentRecordCategory };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export const updateStudentRecordCategoryAction = async (
  input: { id: string; name?: string; color?: string | null },
  studentId?: string,
): Promise<
  | { success: true; data: StudentRecordCategory }
  | { success: false; error: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { updateStudentRecordCategory } = await client.request<{
      updateStudentRecordCategory: StudentRecordCategory;
    }>(UpdateDocument, { input });
    revalidateStudent(studentId);
    return { success: true, data: updateStudentRecordCategory };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const archiveStudentRecordCategoryAction = async (
  id: string,
  studentId?: string,
): Promise<{ success: true } | { success: false; error: string }> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(ArchiveDocument, { id });
    revalidateStudent(studentId);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Archive failed",
    };
  }
};

export const reorderStudentRecordCategoriesAction = async (
  ids: string[],
  studentId?: string,
): Promise<
  | { success: true; data: StudentRecordCategory[] }
  | { success: false; error: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { reorderStudentRecordCategories } = await client.request<{
      reorderStudentRecordCategories: StudentRecordCategory[];
    }>(ReorderDocument, { input: { ids } });
    revalidateStudent(studentId);
    return { success: true, data: reorderStudentRecordCategories };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Reorder failed",
    };
  }
};
