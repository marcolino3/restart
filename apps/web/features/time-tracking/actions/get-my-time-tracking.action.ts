"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type {
  MyTimeTrackingData,
  TimeEntry,
  VacationBalance,
  WorkTimeBalance,
} from "../types";

const MyEmployeeIdDocument = gql`
  query MyEmployeeId {
    myEmployeeId
  }
`;

const MyTimeTrackingDocument = gql`
  query MyTimeTracking($employeeId: ID!, $from: String!, $to: String!) {
    myWorkTimeBalance(from: $from, to: $to) {
      employeeId
      fromDate
      toDate
      plannedMinutes
      workedMinutes
      vacationMinutes
      absenceMinutes
      actualMinutes
      differenceMinutes
      openingWorkMinutes
      paidOvertimeMinutes
      netBalanceMinutes
      vacationDaysUsed
      absenceDaysCount
    }
    myVacationBalance(from: $from, to: $to) {
      entitlementDays
      openingDays
      usedDays
      remainingDays
    }
    timeTrackingByEmployeeId(employeeId: $employeeId, from: $from, to: $to) {
      id
      startedAt
      endedAt
      breakMinutes
      workMinutes
      notes
      entryDate
      source
    }
  }
`;

/**
 * Lädt die komplette "Meine Zeit"-Ansicht: eigene employeeId, Salden und
 * Zeiteinträge für die aktuelle Periode (v1: laufendes Kalenderjahr).
 */
export const getMyTimeTrackingAction =
  async (): Promise<MyTimeTrackingData> => {
    const client = await serverCookieGqlClient();
    const now = new Date();
    const year = now.getFullYear();
    const fromDate = `${year}-01-01`;
    const toDate = `${year}-12-31`;

    const empty: MyTimeTrackingData = {
      employeeId: null,
      balance: null,
      vacation: null,
      entries: [],
      openEntry: null,
      fromDate,
      toDate,
    };

    try {
      const { myEmployeeId } = await client.request<{
        myEmployeeId: string | null;
      }>(MyEmployeeIdDocument);
      if (!myEmployeeId) return empty;

      const data = await client.request<{
        myWorkTimeBalance: WorkTimeBalance;
        myVacationBalance: VacationBalance;
        timeTrackingByEmployeeId: TimeEntry[];
      }>(MyTimeTrackingDocument, { employeeId: myEmployeeId, from: fromDate, to: toDate });

      const entries = data.timeTrackingByEmployeeId ?? [];
      const openEntry = entries.find((e) => !e.endedAt) ?? null;

      return {
        employeeId: myEmployeeId,
        balance: data.myWorkTimeBalance,
        vacation: data.myVacationBalance,
        entries,
        openEntry,
        fromDate,
        toDate,
      };
    } catch (error) {
      console.error("getMyTimeTrackingAction", error);
      return empty;
    }
  };
