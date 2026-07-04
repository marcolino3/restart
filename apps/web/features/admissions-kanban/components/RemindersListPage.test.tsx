import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { RemindersListPage } from "./RemindersListPage";
import type { OrgAdmissionReminder } from "../actions/get-org-admission-reminders.action";

// ── module mocks ───────────────────────────────────────────────────
const getOrgAdmissionRemindersAction = vi.fn();
vi.mock("../actions/get-org-admission-reminders.action", () => ({
  getOrgAdmissionRemindersAction: (...args: unknown[]) =>
    getOrgAdmissionRemindersAction(...args),
}));
vi.mock("../actions/mutate-admission-reminder.action", () => ({
  completeAdmissionReminderAction: vi.fn(),
  uncompleteAdmissionReminderAction: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/admissions/reminders",
  Link: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

// ── helpers ────────────────────────────────────────────────────────
const reminder = (
  overrides: Partial<OrgAdmissionReminder> = {},
): OrgAdmissionReminder =>
  ({
    id: "r-1",
    applicationId: "app-1",
    applicationChildName: "Kind A",
    title: "Open reminder",
    note: null,
    dueAt: "2030-01-01T10:00:00.000Z",
    completedAt: null,
    assignedToName: null,
    ...overrides,
  }) as OrgAdmissionReminder;

const openReminder = reminder({ id: "r-open", title: "Open reminder" });
const completedReminder = reminder({
  id: "r-done",
  title: "Completed reminder",
  completedAt: "2025-01-01T10:00:00.000Z",
});

describe("RemindersListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refetches when returning to the initial filter after viewing another tab (regression)", async () => {
    const user = userEvent.setup();
    getOrgAdmissionRemindersAction.mockImplementation((filter: string) => {
      const data =
        filter === "COMPLETED" ? [completedReminder] : [openReminder];
      return Promise.resolve({ success: true, data });
    });

    render(
      <RemindersListPage
        initialFilter="OPEN"
        initialReminders={[openReminder]}
        canEdit
      />,
    );

    // Initial OPEN tab uses server-fetched data — no refetch on first render.
    expect(screen.getByText("Open reminder")).toBeInTheDocument();
    expect(getOrgAdmissionRemindersAction).not.toHaveBeenCalled();

    // Switch to COMPLETED → refetch shows the completed reminder.
    await user.click(
      screen.getByRole("tab", { name: "remindersFilterCompleted" }),
    );
    await waitFor(() =>
      expect(screen.getByText("Completed reminder")).toBeInTheDocument(),
    );
    expect(getOrgAdmissionRemindersAction).toHaveBeenLastCalledWith(
      "COMPLETED",
    );

    // Switch back to OPEN → must refetch and show open reminders again,
    // not the stale completed data from the previous tab.
    await user.click(screen.getByRole("tab", { name: "remindersFilterOpen" }));
    await waitFor(() =>
      expect(getOrgAdmissionRemindersAction).toHaveBeenLastCalledWith("OPEN"),
    );
    await waitFor(() =>
      expect(screen.getByText("Open reminder")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Completed reminder")).not.toBeInTheDocument();
  });
});
