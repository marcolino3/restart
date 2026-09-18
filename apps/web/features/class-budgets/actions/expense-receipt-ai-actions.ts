"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ActionResult, ExpenseReceiptSuggestion } from "../types";

const ConfiguredDocument = gql`
  query ExpenseAiConfigured {
    expenseAiConfigured
  }
`;

const AnalyzeDocument = gql`
  mutation AnalyzeExpenseReceipt($schoolClassId: ID!, $fileId: String!) {
    analyzeExpenseReceipt(schoolClassId: $schoolClassId, fileId: $fileId) {
      vendor
      invoiceNumber
      expenseDate
      amount
      currency
      description
      suggestedCategoryId
      confidence
    }
  }
`;

/** Controls whether the "analyse with AI" button is offered at all. */
export const getExpenseAiConfiguredAction = async (): Promise<boolean> => {
  const client = await serverCookieGqlClient();
  try {
    const { expenseAiConfigured } = await client.request<{
      expenseAiConfigured: boolean;
    }>(ConfiguredDocument);
    return expenseAiConfigured;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const analyzeExpenseReceiptAction = async (
  schoolClassId: string,
  fileId: string,
): Promise<ActionResult<ExpenseReceiptSuggestion>> => {
  const client = await serverCookieGqlClient();
  try {
    const { analyzeExpenseReceipt } = await client.request<{
      analyzeExpenseReceipt: ExpenseReceiptSuggestion;
    }>(AnalyzeDocument, { schoolClassId, fileId });
    return { success: true, data: analyzeExpenseReceipt };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
};
