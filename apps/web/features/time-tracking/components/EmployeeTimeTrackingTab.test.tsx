import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EmployeeTimeTrackingTab, {
  EmployeeTimeTrackingStats,
} from "./EmployeeTimeTrackingTab";
import type { MonthlyTimeTrackingGroup } from "../types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  useLocale: () => "de",
}));

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const cursor = { year: currentYear, month: currentMonth };

const groups: MonthlyTimeTrackingGroup[] = [
  {
    year: currentYear,
    month: currentMonth,
    workedMinutes: 960,
    plannedMinutes: 1000,
    days: [
      {
        date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
        kind: "ENTRY",
        label: null,
        color: null,
        workMinutes: 480,
        plannedMinutes: 480,
        entries: [
          {
            id: "e1",
            startedAt: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01T08:00:00.000Z`,
            endedAt: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01T16:00:00.000Z`,
            breakMinutes: 30,
            workMinutes: 480,
            notes: null,
          },
        ],
      },
      {
        date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-02`,
        kind: "ENTRY",
        label: null,
        color: null,
        workMinutes: 480,
        plannedMinutes: 520,
        entries: [
          {
            id: "e2",
            startedAt: `${currentYear}-${String(currentMonth).padStart(2, "0")}-02T08:00:00.000Z`,
            endedAt: `${currentYear}-${String(currentMonth).padStart(2, "0")}-02T15:50:00.000Z`,
            breakMinutes: 30,
            workMinutes: 480,
            notes: null,
          },
        ],
      },
    ],
  },
];

describe("EmployeeTimeTrackingStats", () => {
  it("shows monthly Soll/Ist KPIs derived from the current cursor group", () => {
    render(
      <EmployeeTimeTrackingStats
        cursor={cursor}
        group={groups[0]}
        netBalanceMinutes={120}
        missingRecordDaysCount={0}
      />,
    );
    expect(screen.getByText("16.7 h")).toBeInTheDocument();
    expect(screen.getByText("+2:00")).toBeInTheDocument();
  });
});

describe("EmployeeTimeTrackingTab", () => {
  it("marks a day from missingRecordDays as open in the status column", () => {
    render(
      <EmployeeTimeTrackingTab
        monthlyGroups={groups}
        missingRecordDays={[
          `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
        ]}
        workloadPercent={null}
        cursor={cursor}
        onCursorChange={vi.fn()}
      />,
    );
    expect(screen.getByText("mz.statusOpen")).toBeInTheDocument();
  });

  it("filters rows to only deviations when the deviations chip is selected", async () => {
    const user = userEvent.setup();
    render(
      <EmployeeTimeTrackingTab
        monthlyGroups={groups}
        missingRecordDays={[]}
        workloadPercent={100}
        cursor={cursor}
        onCursorChange={vi.fn()}
      />,
    );
    await user.click(screen.getByText("mz.filterDeviations"));
    const rows = screen.getAllByText(/mz\.statusRecorded/);
    expect(rows).toHaveLength(1);
  });

  it("calls onMonthChange with the from/to range of the active month", () => {
    const onMonthChange = vi.fn();
    render(
      <EmployeeTimeTrackingTab
        monthlyGroups={groups}
        missingRecordDays={[]}
        workloadPercent={100}
        cursor={cursor}
        onCursorChange={vi.fn()}
        onMonthChange={onMonthChange}
      />,
    );
    expect(onMonthChange).toHaveBeenCalledWith(
      expect.objectContaining({ year: currentYear, month: currentMonth }),
    );
  });
});
