"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ActionResult, ExpenseCategory } from "../types";

const CATEGORY_FIELDS = `
  id
  name
  color
  position
  isArchived
`;

const ListDocument = gql`
  query ExpenseCategories($includeArchived: Boolean) {
    expenseCategories(includeArchived: $includeArchived) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const CreateDocument = gql`
  mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {
    createExpenseCategory(input: $input) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateExpenseCategory($input: UpdateExpenseCategoryInput!) {
    updateExpenseCategory(input: $input) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const ArchiveDocument = gql`
  mutation ArchiveExpenseCategory($id: ID!) {
    archiveExpenseCategory(id: $id)
  }
`;

const ReorderDocument = gql`
  mutation ReorderExpenseCategories($input: ReorderExpenseCategoriesInput!) {
    reorderExpenseCategories(input: $input) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const failure = (error: unknown, fallback: string) => {
  console.error(error);
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback,
  };
};

export const getExpenseCategoriesAction = async (
  includeArchived = false,
): Promise<ExpenseCategory[]> => {
  const client = await serverCookieGqlClient();
  const { expenseCategories } = await client.request<{
    expenseCategories: ExpenseCategory[];
  }>(ListDocument, { includeArchived });
  return expenseCategories;
};

export const createExpenseCategoryAction = async (input: {
  name: string;
  color?: string | null;
}): Promise<ActionResult<ExpenseCategory>> => {
  const client = await serverCookieGqlClient();
  try {
    const cleaned = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== null && v !== undefined),
    );
    const { createExpenseCategory } = await client.request<{
      createExpenseCategory: ExpenseCategory;
    }>(CreateDocument, { input: cleaned });
    return { success: true, data: createExpenseCategory };
  } catch (error) {
    return failure(error, "Create failed");
  }
};

export const updateExpenseCategoryAction = async (input: {
  id: string;
  name?: string;
  color?: string | null;
  isArchived?: boolean;
}): Promise<ActionResult<ExpenseCategory>> => {
  const client = await serverCookieGqlClient();
  try {
    const { updateExpenseCategory } = await client.request<{
      updateExpenseCategory: ExpenseCategory;
    }>(UpdateDocument, { input });
    return { success: true, data: updateExpenseCategory };
  } catch (error) {
    return failure(error, "Update failed");
  }
};

export const archiveExpenseCategoryAction = async (
  id: string,
): Promise<ActionResult<boolean>> => {
  const client = await serverCookieGqlClient();
  try {
    const { archiveExpenseCategory } = await client.request<{
      archiveExpenseCategory: boolean;
    }>(ArchiveDocument, { id });
    return { success: true, data: archiveExpenseCategory };
  } catch (error) {
    return failure(error, "Archive failed");
  }
};

export const reorderExpenseCategoriesAction = async (
  ids: string[],
): Promise<ActionResult<ExpenseCategory[]>> => {
  const client = await serverCookieGqlClient();
  try {
    const { reorderExpenseCategories } = await client.request<{
      reorderExpenseCategories: ExpenseCategory[];
    }>(ReorderDocument, { input: { ids } });
    return { success: true, data: reorderExpenseCategories };
  } catch (error) {
    return failure(error, "Reorder failed");
  }
};
