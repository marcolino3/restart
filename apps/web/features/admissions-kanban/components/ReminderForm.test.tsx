import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReminderForm } from "./ReminderForm";

// i18n → identity so we can assert on the raw keys.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("../actions/mutate-admission-reminder.action", () => ({
  createAdmissionReminderAction: vi.fn(),
  updateAdmissionReminderAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const members = [
  { id: "m-1", name: "Anna Meier" },
  { id: "m-2", name: "Thomas Weber" },
];

describe("ReminderForm", () => {
  it("renders the full field set (parity with the reminder dialog)", () => {
    render(
      <ReminderForm
        applicationId="app-1"
        members={members}
        onSaved={vi.fn()}
      />,
    );

    // The same field set the design's reminder modal exposes.
    expect(screen.getByText("reminderTitle")).toBeInTheDocument();
    expect(screen.getByText("reminderDueLabel")).toBeInTheDocument();
    expect(screen.getByText("reminderTimeLabel")).toBeInTheDocument();
    expect(screen.getByText("reminderQuickSelect")).toBeInTheDocument();
    expect(screen.getByText("reminderAssignee")).toBeInTheDocument();
    expect(screen.getByText("reminderNoteLabel")).toBeInTheDocument();

    // Quick-select presets.
    [
      "reminderPreset1d",
      "reminderPreset3d",
      "reminderPreset1w",
      "reminderPreset2w",
    ].forEach((k) => expect(screen.getByText(k)).toBeInTheDocument());

    // A dedicated time input.
    expect(document.querySelector('input[type="time"]')).not.toBeNull();

    // Auto-task hint + badge (reminders always create a task).
    expect(screen.getByText("reminderAutoTaskHint")).toBeInTheDocument();
    expect(screen.getByText("reminderAutoTaskBadge")).toBeInTheDocument();

    // Create submit label.
    expect(screen.getByText("reminderNewSubmit")).toBeInTheDocument();
  });
});
