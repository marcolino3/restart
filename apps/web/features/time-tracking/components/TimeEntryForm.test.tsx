import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TimeEntryForm } from "./TimeEntryForm";
import type { TimeEntry } from "../types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "de",
}));
const closeSheet = vi.fn();
vi.mock("@/components/providers/sheet-provider", () => ({
  useSheet: () => ({ open: vi.fn(), close: closeSheet }),
}));
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));
const createTimeEntryAction = vi.fn();
const updateTimeEntryAction = vi.fn();
vi.mock("../actions/mutate-time-entry.action", () => ({
  createTimeEntryAction: (...args: unknown[]) => createTimeEntryAction(...args),
  updateTimeEntryAction: (...args: unknown[]) => updateTimeEntryAction(...args),
}));

const todayIso = new Date().toISOString().slice(0, 10);
const entry: TimeEntry = {
  id: "entry-1",
  startedAt: `${todayIso}T08:00:00.000Z`,
  endedAt: `${todayIso}T16:00:00.000Z`,
  breakMinutes: 30,
  workMinutes: 480,
  notes: "Bemerkung",
  entryDate: todayIso,
  source: "MANUAL",
};

describe("TimeEntryForm", () => {
  beforeEach(() => {
    closeSheet.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
    createTimeEntryAction.mockClear();
    updateTimeEntryAction.mockClear();
  });

  it("shows 'addEntry' as the submit label when creating a new entry", () => {
    render(<TimeEntryForm employeeId="emp-1" />);
    expect(
      screen.getByRole("button", { name: "addEntry" }),
    ).toBeInTheDocument();
  });

  it("shows 'saveEntry' and calls updateTimeEntryAction when editing an existing entry", async () => {
    updateTimeEntryAction.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<TimeEntryForm employeeId="emp-1" entry={entry} />);

    const submit = screen.getByRole("button", { name: "saveEntry" });
    await user.click(submit);

    expect(updateTimeEntryAction).toHaveBeenCalledWith(
      "entry-1",
      expect.objectContaining({ breakMinutes: 30 }),
    );
    expect(closeSheet).toHaveBeenCalled();
  });

  it("shows the duplicate-day error message when the action fails with TIME_TRACKING_DUPLICATE_DAY", async () => {
    createTimeEntryAction.mockResolvedValue({
      success: false,
      error: "TIME_TRACKING_DUPLICATE_DAY",
    });
    const user = userEvent.setup();
    render(<TimeEntryForm employeeId="emp-1" />);

    await user.click(screen.getByRole("button", { name: "addEntry" }));

    expect(toastError).toHaveBeenCalledWith("errorDuplicateDay");
    expect(closeSheet).not.toHaveBeenCalled();
  });
});
