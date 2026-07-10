import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ActivityTimeline } from "./ActivityTimeline";
import type { AdmissionActivity } from "../actions/get-admission-activities.action";

// i18n → identity so we can assert on the raw keys.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}:${JSON.stringify(vars)}` : key,
  useLocale: () => "de",
}));
vi.mock("../actions/delete-admission-activity.action", () => ({
  deleteAdmissionActivityAction: vi.fn(),
}));
vi.mock("../actions/create-admission-activity.action", () => ({
  createAdmissionActivityAction: vi.fn(),
}));
vi.mock("../actions/update-admission-activity.action", () => ({
  updateAdmissionActivityAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const activity = (
  overrides: Partial<AdmissionActivity> = {},
): AdmissionActivity => ({
  id: "a-1",
  applicationId: "app-1",
  type: "NOTE",
  occurredAt: "2030-06-18T09:00:00.000Z",
  subject: "Erstgespräch mit Mutter geführt",
  body: "Sehr interessiert.",
  direction: null,
  durationMinutes: null,
  location: null,
  createdAt: "2030-06-18T09:00:00.000Z",
  updatedAt: "2030-06-18T09:00:00.000Z",
  createdByMembershipId: "m-1",
  createdByName: "Claudia Vogel",
  ...overrides,
});

describe("ActivityTimeline", () => {
  it("shows the empty state when there are no activities", () => {
    render(
      <ActivityTimeline
        applicationId="app-1"
        activities={[]}
        canEdit
        onChanged={vi.fn()}
      />,
    );
    expect(screen.getByText("activityEmpty")).toBeInTheDocument();
  });

  it("renders each entry's title and subtitle", () => {
    render(
      <ActivityTimeline
        applicationId="app-1"
        activities={[activity()]}
        canEdit
        onChanged={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Erstgespräch mit Mutter geführt"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sehr interessiert\./)).toBeInTheDocument();
  });

  it("clicking the dropdown 'bearbeiten' entry opens the composer for that activity", async () => {
    const user = userEvent.setup();
    render(
      <ActivityTimeline
        applicationId="app-1"
        activities={[activity()]}
        canEdit
        onChanged={vi.fn()}
      />,
    );

    // Open the row's actions menu, then click edit.
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByText("activityEdit"));

    // The composer is now rendered in edit mode with a Cancel button.
    expect(screen.getByText("activityCancel")).toBeInTheDocument();
    // The row itself is no longer rendered as a static list item.
    expect(
      screen.queryByText("Erstgespräch mit Mutter geführt"),
    ).not.toBeInTheDocument();
  });

  it("hides the actions menu when canEdit is false", () => {
    render(
      <ActivityTimeline
        applicationId="app-1"
        activities={[activity()]}
        canEdit={false}
        onChanged={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Actions" }),
    ).not.toBeInTheDocument();
  });

  it("renders a connecting line between entries but not after the last one", () => {
    const { container } = render(
      <ActivityTimeline
        applicationId="app-1"
        activities={[
          activity({ id: "a-1" }),
          activity({ id: "a-2", subject: "Zweiter Eintrag" }),
        ]}
        canEdit
        onChanged={vi.fn()}
      />,
    );
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(2);
    // First entry has a connecting line, the last does not.
    expect(
      items[0]?.querySelector('[data-testid="timeline-connector"]'),
    ).not.toBeNull();
    expect(
      items[1]?.querySelector('[data-testid="timeline-connector"]'),
    ).toBeNull();
  });
});
