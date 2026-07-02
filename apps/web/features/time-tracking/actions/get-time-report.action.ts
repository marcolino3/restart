"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import type {
  AbsenceCategorySummary,
  EmployeeWorkTimeOverviewRow,
  MonthlyWorkTimeSummary,
  VacationBalance,
  WorkTimeBalance,
} from "../types";

const currentYearRange = () => {
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
};

const TeamOverviewDocument = gql`
  query TeamOverview($from: String!, $to: String!) {
    teamWorkTimeOverview(from: $from, to: $to) {
      employeeId
      employeeName
      netBalanceMinutes
      vacationDaysUsed
    }
  }
`;

export type TeamOverviewResult = {
  rows: EmployeeWorkTimeOverviewRow[];
  from: string;
  to: string;
};

export const getTeamOverviewAction = async (): Promise<TeamOverviewResult> => {
  const client = await serverCookieGqlClient();
  const { from, to } = currentYearRange();
  try {
    const { teamWorkTimeOverview } = await client.request<{
      teamWorkTimeOverview: EmployeeWorkTimeOverviewRow[];
    }>(TeamOverviewDocument, { from, to });
    return { rows: teamWorkTimeOverview ?? [], from, to };
  } catch (error) {
    console.error("getTeamOverviewAction", error);
    return { rows: [], from, to };
  }
};

const EmployeeReportDocument = gql`
  query EmployeeReport(
    $employeeId: ID!
    $from: String!
    $to: String!
    $locale: String
  ) {
    employeeMissingRecordDays(employeeId: $employeeId, from: $from, to: $to)
    employeeAbsenceCategorySummary(
      employeeId: $employeeId
      from: $from
      to: $to
      locale: $locale
    ) {
      categoryId
      name
      color
      fullDays
      partialDays
      totalDays
    }
    employeeWorkTimeBalance(employeeId: $employeeId, from: $from, to: $to) {
      employeeId
      plannedMinutes
      workedMinutes
      vacationMinutes
      absenceMinutes
      differenceMinutes
      openingWorkMinutes
      paidOvertimeMinutes
      netBalanceMinutes
      vacationDaysUsed
      absenceDaysCount
    }
    employeeVacationBalance(employeeId: $employeeId, from: $from, to: $to) {
      entitlementDays
      openingDays
      usedDays
      remainingDays
    }
    employeeMonthlyWorkTime(employeeId: $employeeId, from: $from, to: $to) {
      year
      month
      plannedMinutes
      actualMinutes
      differenceMinutes
    }
  }
`;

export type EmployeeReportResult = {
  balance: WorkTimeBalance | null;
  vacation: VacationBalance | null;
  monthly: MonthlyWorkTimeSummary[];
  missingRecordDays: string[];
  categorySummary: AbsenceCategorySummary[];
  from: string;
  to: string;
};

export const getEmployeeReportAction = async (
  employeeId: string
): Promise<EmployeeReportResult> => {
  const client = await serverCookieGqlClient();
  const { from, to } = currentYearRange();
  const locale = (await getLocale()).toUpperCase();
  try {
    const data = await client.request<{
      employeeWorkTimeBalance: WorkTimeBalance;
      employeeVacationBalance: VacationBalance;
      employeeMonthlyWorkTime: MonthlyWorkTimeSummary[];
      employeeMissingRecordDays: string[];
      employeeAbsenceCategorySummary: AbsenceCategorySummary[];
    }>(EmployeeReportDocument, { employeeId, from, to, locale });
    return {
      balance: data.employeeWorkTimeBalance,
      vacation: data.employeeVacationBalance,
      monthly: data.employeeMonthlyWorkTime ?? [],
      missingRecordDays: data.employeeMissingRecordDays ?? [],
      categorySummary: data.employeeAbsenceCategorySummary ?? [],
      from,
      to,
    };
  } catch (error) {
    console.error("getEmployeeReportAction", error);
    return {
      balance: null,
      vacation: null,
      monthly: [],
      missingRecordDays: [],
      categorySummary: [],
      from,
      to,
    };
  }
};
