"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type {
  ActionResult,
  BudgetSchoolYear,
  ClassBudget,
  ClassBudgetSummary,
} from "../types";

const BUDGET_FIELDS = `
  id
  schoolClassId
  schoolYearStart
  amount
  currency
  note
`;

const SCHOOL_YEAR_FIELDS = `
  start
  end
  startYear
  label
`;

const ListDocument = gql`
  query ClassBudgets($schoolYearStart: Int!) {
    classBudgets(schoolYearStart: $schoolYearStart) {
      ${BUDGET_FIELDS}
    }
  }
`;

const SummaryDocument = gql`
  query ClassBudgetSummary($schoolClassId: ID!, $schoolYearStart: Int!) {
    classBudgetSummary(
      schoolClassId: $schoolClassId
      schoolYearStart: $schoolYearStart
    ) {
      schoolClassId
      schoolYear {
        ${SCHOOL_YEAR_FIELDS}
      }
      budget
      spent
      remaining
      isOverBudget
      currency
      expenseCount
      studentCount
      byCategory {
        total
        category {
          id
          name
          color
        }
      }
    }
  }
`;

const SchoolYearsDocument = gql`
  query ClassBudgetSchoolYears {
    classBudgetSchoolYears {
      ${SCHOOL_YEAR_FIELDS}
    }
  }
`;

const UpsertDocument = gql`
  mutation UpsertClassBudget($input: UpsertClassBudgetInput!) {
    upsertClassBudget(input: $input) {
      ${BUDGET_FIELDS}
    }
  }
`;

const CopyDocument = gql`
  mutation CopyClassBudgetsFromPreviousYear($schoolYearStart: Int!) {
    copyClassBudgetsFromPreviousYear(schoolYearStart: $schoolYearStart) {
      ${BUDGET_FIELDS}
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

export const getClassBudgetsAction = async (
  schoolYearStart: number,
): Promise<ClassBudget[]> => {
  const client = await serverCookieGqlClient();
  const { classBudgets } = await client.request<{
    classBudgets: ClassBudget[];
  }>(ListDocument, { schoolYearStart });
  return classBudgets;
};

export const getClassBudgetSummaryAction = async (
  schoolClassId: string,
  schoolYearStart: number,
): Promise<ActionResult<ClassBudgetSummary>> => {
  const client = await serverCookieGqlClient();
  try {
    const { classBudgetSummary } = await client.request<{
      classBudgetSummary: ClassBudgetSummary;
    }>(SummaryDocument, { schoolClassId, schoolYearStart });
    return { success: true, data: classBudgetSummary };
  } catch (error) {
    return failure(error, "Load failed");
  }
};

/** School years that can be selected; the current one always comes first. */
export const getClassBudgetSchoolYearsAction = async (): Promise<
  BudgetSchoolYear[]
> => {
  const client = await serverCookieGqlClient();
  const { classBudgetSchoolYears } = await client.request<{
    classBudgetSchoolYears: BudgetSchoolYear[];
  }>(SchoolYearsDocument);
  return classBudgetSchoolYears;
};

export const upsertClassBudgetAction = async (input: {
  schoolClassId: string;
  schoolYearStart: number;
  amount: number;
  note?: string | null;
}): Promise<ActionResult<ClassBudget>> => {
  const client = await serverCookieGqlClient();
  try {
    const { upsertClassBudget } = await client.request<{
      upsertClassBudget: ClassBudget;
    }>(UpsertDocument, { input });
    return { success: true, data: upsertClassBudget };
  } catch (error) {
    return failure(error, "Save failed");
  }
};

export const copyClassBudgetsFromPreviousYearAction = async (
  schoolYearStart: number,
): Promise<ActionResult<ClassBudget[]>> => {
  const client = await serverCookieGqlClient();
  try {
    const { copyClassBudgetsFromPreviousYear } = await client.request<{
      copyClassBudgetsFromPreviousYear: ClassBudget[];
    }>(CopyDocument, { schoolYearStart });
    return { success: true, data: copyClassBudgetsFromPreviousYear };
  } catch (error) {
    return failure(error, "Copy failed");
  }
};
