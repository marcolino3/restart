"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import type { MonthlyTimeTrackingGroup } from "../types";

const EmployeeMonthlyTimeTrackingDocument = gql`
  query EmployeeMonthlyTimeTracking(
    $employeeId: ID!
    $from: String!
    $to: String!
    $locale: String
  ) {
    employeeMonthlyTimeTracking(
      employeeId: $employeeId
      from: $from
      to: $to
      locale: $locale
    ) {
      year
      month
      workedMinutes
      plannedMinutes
      days {
        date
        kind
        label
        color
        workMinutes
        plannedMinutes
        entries {
          id
          startedAt
          endedAt
          breakMinutes
          workMinutes
          notes
        }
      }
    }
  }
`;

const currentYearRange = () => {
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
};

export type EmployeeMonthlyTimeTrackingResult = {
  monthlyGroups: MonthlyTimeTrackingGroup[];
  from: string;
  to: string;
};

/**
 * Lädt die Tages-/Monatsgruppen für den Zeiterfassungs-Tab der
 * Mitarbeiter-Detailseite (v1: laufendes Kalenderjahr, Monatswechsel läuft
 * clientseitig auf den bereits geladenen Gruppen).
 */
export const getEmployeeMonthlyTimeTrackingAction = async (
  employeeId: string
): Promise<EmployeeMonthlyTimeTrackingResult> => {
  const client = await serverCookieGqlClient();
  const { from, to } = currentYearRange();
  const locale = (await getLocale()).toUpperCase();

  try {
    const data = await client.request<{
      employeeMonthlyTimeTracking: MonthlyTimeTrackingGroup[];
    }>(EmployeeMonthlyTimeTrackingDocument, {
      employeeId,
      from,
      to,
      locale,
    });
    return {
      monthlyGroups: data.employeeMonthlyTimeTracking ?? [],
      from,
      to,
    };
  } catch (error) {
    console.error("getEmployeeMonthlyTimeTrackingAction", error);
    return { monthlyGroups: [], from, to };
  }
};
