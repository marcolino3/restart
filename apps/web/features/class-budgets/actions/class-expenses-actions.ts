"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ActionResult, ClassExpense } from "../types";

const EXPENSE_FIELDS = `
  id
  schoolClassId
  schoolClass {
    id
    name
  }
  categoryId
  category {
    id
    name
    color
  }
  expenseDate
  amount
  currency
  vendor
  invoiceNumber
  description
  receiptFileId
  createdByMembershipId
  canModify
`;

const ListDocument = gql`
  query ClassExpenses(
    $schoolYearStart: Int!
    $schoolClassId: ID
    $categoryId: ID
  ) {
    classExpenses(
      schoolYearStart: $schoolYearStart
      schoolClassId: $schoolClassId
      categoryId: $categoryId
    ) {
      ${EXPENSE_FIELDS}
    }
  }
`;

const CreateDocument = gql`
  mutation CreateClassExpense($input: CreateClassExpenseInput!) {
    createClassExpense(input: $input) {
      ${EXPENSE_FIELDS}
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateClassExpense($input: UpdateClassExpenseInput!) {
    updateClassExpense(input: $input) {
      ${EXPENSE_FIELDS}
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteClassExpense($id: ID!) {
    deleteClassExpense(id: $id) {
      id
    }
  }
`;

export type ClassExpenseInput = {
  schoolClassId: string;
  categoryId: string;
  expenseDate: string;
  amount: number;
  vendor?: string | null;
  invoiceNumber?: string | null;
  description?: string | null;
  receiptFileId?: string | null;
};

const failure = (error: unknown, fallback: string) => {
  console.error(error);
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback,
  };
};

export const getClassExpensesAction = async (filter: {
  schoolYearStart: number;
  schoolClassId?: string | null;
  categoryId?: string | null;
}): Promise<ActionResult<ClassExpense[]>> => {
  const client = await serverCookieGqlClient();
  try {
    const { classExpenses } = await client.request<{
      classExpenses: ClassExpense[];
    }>(ListDocument, filter);
    return { success: true, data: classExpenses };
  } catch (error) {
    return failure(error, "Load failed");
  }
};

export const createClassExpenseAction = async (
  input: ClassExpenseInput,
): Promise<ActionResult<ClassExpense>> => {
  const client = await serverCookieGqlClient();
  try {
    const { createClassExpense } = await client.request<{
      createClassExpense: ClassExpense;
    }>(CreateDocument, { input });
    return { success: true, data: createClassExpense };
  } catch (error) {
    return failure(error, "Create failed");
  }
};

export const updateClassExpenseAction = async (
  input: Partial<ClassExpenseInput> & { id: string },
): Promise<ActionResult<ClassExpense>> => {
  const client = await serverCookieGqlClient();
  try {
    const { updateClassExpense } = await client.request<{
      updateClassExpense: ClassExpense;
    }>(UpdateDocument, { input });
    return { success: true, data: updateClassExpense };
  } catch (error) {
    return failure(error, "Update failed");
  }
};

export const deleteClassExpenseAction = async (
  id: string,
): Promise<ActionResult<string>> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    return { success: true, data: id };
  } catch (error) {
    return failure(error, "Delete failed");
  }
};
