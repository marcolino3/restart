import { gql } from "graphql-request";
import { gqlClient } from "./gql-client";

export type TimeEntry = {
  id: string;
  startedAt: string;
  endedAt?: string | null;
  breakMinutes?: number | null;
  workMinutes?: number | null;
  notes?: string | null;
  entryDate: string;
  source: "CLOCK" | "MANUAL";
};

export type WorkTimeBalance = {
  workedMinutes: number;
  plannedMinutes: number;
  netBalanceMinutes: number;
  absenceDaysCount: number;
};

export type VacationBalance = {
  entitlementDays: number;
  remainingDays: number;
};

export type MyTimeTracking = {
  employeeId: string | null;
  balance: WorkTimeBalance | null;
  vacation: VacationBalance | null;
  entries: TimeEntry[];
  openEntry: TimeEntry | null;
};

const MyEmployeeIdDocument = gql`
  query MyEmployeeId {
    myEmployeeId
  }
`;

const MyDataDocument = gql`
  query MyMobileTimeTracking($employeeId: ID!, $from: String!, $to: String!) {
    myWorkTimeBalance(from: $from, to: $to) {
      workedMinutes
      plannedMinutes
      netBalanceMinutes
      absenceDaysCount
    }
    myVacationBalance(from: $from, to: $to) {
      entitlementDays
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

const StartDocument = gql`
  mutation StartClock($employeeId: ID!) {
    startTimeTracking(employeeId: $employeeId) {
      id
    }
  }
`;

const StopDocument = gql`
  mutation StopClock($employeeId: ID!) {
    stopTimeTracking(employeeId: $employeeId) {
      id
    }
  }
`;

const currentYearRange = () => {
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
};

export async function fetchMyTimeTracking(): Promise<MyTimeTracking> {
  const { myEmployeeId } = await gqlClient.request<{
    myEmployeeId: string | null;
  }>(MyEmployeeIdDocument);

  if (!myEmployeeId) {
    return {
      employeeId: null,
      balance: null,
      vacation: null,
      entries: [],
      openEntry: null,
    };
  }

  const { from, to } = currentYearRange();
  const data = await gqlClient.request<{
    myWorkTimeBalance: WorkTimeBalance;
    myVacationBalance: VacationBalance;
    timeTrackingByEmployeeId: TimeEntry[];
  }>(MyDataDocument, { employeeId: myEmployeeId, from, to });

  const entries = data.timeTrackingByEmployeeId ?? [];
  return {
    employeeId: myEmployeeId,
    balance: data.myWorkTimeBalance,
    vacation: data.myVacationBalance,
    entries,
    openEntry: entries.find((e) => !e.endedAt) ?? null,
  };
}

export async function startClock(employeeId: string): Promise<void> {
  await gqlClient.request(StartDocument, { employeeId });
}

export async function stopClock(employeeId: string): Promise<void> {
  await gqlClient.request(StopDocument, { employeeId });
}

/** Minuten → "H:MM" (Vorzeichen bleibt erhalten). */
export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  return `${sign}${Math.floor(abs / 60)}:${(abs % 60)
    .toString()
    .padStart(2, "0")}`;
}

/** ISO → "HH:MM" (lokal). */
export function timeOf(iso?: string | null): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}
