import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MonthlyTimeEntriesAccordion } from "./MonthlyTimeEntriesAccordion";
import type { MonthlyTimeTrackingGroup } from "../types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "de",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
const openSheet = vi.fn();
vi.mock("@/components/providers/sheet-provider", () => ({
  useSheet: () => ({ open: openSheet, close: vi.fn() }),
}));
const deleteTimeEntryAction = vi.fn();
vi.mock("../actions/mutate-time-entry.action", () => ({
  deleteTimeEntryAction: (...args: unknown[]) => deleteTimeEntryAction(...args),
}));

const group = (
  overrides: Partial<MonthlyTimeTrackingGroup> = {},
): MonthlyTimeTrackingGroup => ({
  year: 2026,
  month: 1,
  workedMinutes: 480,
  plannedMinutes: 480,
  days: [
    {
      date: "2026-01-15",
      kind: "ENTRY",
      label: null,
      color: null,
      workMinutes: 480,
      plannedMinutes: 480,
      entries: [
        {
          id: "entry-1",
          startedAt: "2026-01-15T08:00:00.000Z",
          endedAt: "2026-01-15T16:00:00.000Z",
          breakMinutes: 30,
          workMinutes: 480,
          notes: null,
        },
      ],
    },
  ],
  ...overrides,
});

describe("MonthlyTimeEntriesAccordion", () => {
  it("shows the empty state when there are no monthly groups", () => {
    render(
      <MonthlyTimeEntriesAccordion employeeId="emp-1" monthlyGroups={[]} />,
    );
    expect(screen.getByText("noEntriesYet")).toBeInTheDocument();
  });

  it("renders an absence day with its label instead of a time entry row", async () => {
    const user = userEvent.setup();
    render(
      <MonthlyTimeEntriesAccordion
        employeeId="emp-1"
        monthlyGroups={[
          group({
            days: [
              {
                date: "2026-01-16",
                kind: "ABSENCE",
                label: "Ferien",
                color: "#ff0000",
                workMinutes: 0,
                plannedMinutes: 0,
                entries: null,
              },
            ],
          }),
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /2026/ }));
    expect(screen.getByText("Ferien")).toBeInTheDocument();
  });

  it("opens the delete confirmation and calls deleteTimeEntryAction for the selected entry", async () => {
    deleteTimeEntryAction.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <MonthlyTimeEntriesAccordion
        employeeId="emp-1"
        monthlyGroups={[group()]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /2026/ }));
    await user.click(screen.getByRole("button", { name: "openMenu" }));
    await user.click(screen.getByText("deleteEntry"));
    await user.click(screen.getByText("delete"));

    expect(deleteTimeEntryAction).toHaveBeenCalledWith("entry-1");
  });
});
