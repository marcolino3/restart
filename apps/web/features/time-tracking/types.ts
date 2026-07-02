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
  employeeId: string;
  fromDate: string;
  toDate: string;
  plannedMinutes: number;
  workedMinutes: number;
  vacationMinutes: number;
  absenceMinutes: number;
  actualMinutes: number;
  differenceMinutes: number;
  openingWorkMinutes: number;
  paidOvertimeMinutes: number;
  netBalanceMinutes: number;
  vacationDaysUsed: number;
  absenceDaysCount: number;
};

export type VacationBalance = {
  entitlementDays: number;
  openingDays: number;
  usedDays: number;
  remainingDays: number;
};

export type MonthlyWorkTimeSummary = {
  year: number;
  month: number;
  plannedMinutes: number;
  actualMinutes: number;
  differenceMinutes: number;
};

export type EmployeeWorkTimeOverviewRow = {
  employeeId: string;
  employeeName?: string | null;
  netBalanceMinutes: number;
  vacationDaysUsed: number;
};

export type AbsenceCategorySummary = {
  categoryId: string;
  name?: string | null;
  color?: string | null;
  fullDays: number;
  partialDays: number;
  totalDays: number;
};

/** Minimal employee option for admin selects. */
export type EmployeeOption = {
  id: string;
  name: string;
};

export type MyTimeTrackingData = {
  employeeId: string | null;
  balance: WorkTimeBalance | null;
  vacation: VacationBalance | null;
  entries: TimeEntry[];
  openEntry: TimeEntry | null;
  fromDate: string;
  toDate: string;
};
