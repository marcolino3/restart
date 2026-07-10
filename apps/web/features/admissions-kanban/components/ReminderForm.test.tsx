import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReminderForm } from "./ReminderForm";

// i18n → identity so we can assert on the raw keys.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "de",
}));

// The date-time popover uses Pointer Capture + scrollIntoView (jsdom lacks both).
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});
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

    // The same field set the design's reminder modal exposes. Date + time are
    // now one combined control (DateTimeCalendarFormField).
    expect(screen.getByText("reminderTitle")).toBeInTheDocument();
    expect(screen.getByText("reminderDueLabel")).toBeInTheDocument();
    expect(screen.getByText("reminderAssignee")).toBeInTheDocument();
    expect(screen.getByText("reminderNoteLabel")).toBeInTheDocument();

    // No separate quick-select section / native time input anymore — the
    // presets live inside the popover, time is chosen via slot buttons.
    expect(screen.queryByText("reminderTimeLabel")).not.toBeInTheDocument();
    expect(screen.queryByText("reminderQuickSelect")).not.toBeInTheDocument();
    expect(document.querySelector('input[type="time"]')).toBeNull();

    // Auto-task hint + badge (reminders always create a task).
    expect(screen.getByText("reminderAutoTaskHint")).toBeInTheDocument();
    expect(screen.getByText("reminderAutoTaskBadge")).toBeInTheDocument();

    // Create submit label.
    expect(screen.getByText("reminderNewSubmit")).toBeInTheDocument();
  });

  it("shows the quick-select presets inside the date-time popover", async () => {
    const user = userEvent.setup();
    render(
      <ReminderForm applicationId="app-1" members={members} onSaved={vi.fn()} />,
    );
    // Presets are not in the form body...
    expect(screen.queryByText("reminderPreset1d")).not.toBeInTheDocument();
    // ...they appear once the date-time trigger (the only button before the
    // submit row) opens the popover.
    const trigger = screen
      .getAllByRole("button")
      .find((b) => b.getAttribute("aria-haspopup") === "dialog");
    await user.click(trigger!);
    [
      "reminderPreset1d",
      "reminderPreset3d",
      "reminderPreset1w",
      "reminderPreset2w",
    ].forEach((k) => expect(screen.getByText(k)).toBeInTheDocument());
  });
});
