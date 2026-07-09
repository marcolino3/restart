import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ActivityComposer } from "./ActivityComposer";

// Radix Select relies on Pointer Capture + scrollIntoView, which jsdom lacks.
// Polyfill them so the dropdown can open in tests (no-ops are sufficient).
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
  // The inline appointment panel uses a combobox that observes resize.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// i18n → identity so we can assert on the raw keys.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "de",
}));
vi.mock("../actions/create-admission-activity.action", () => ({
  createAdmissionActivityAction: vi.fn(),
}));
vi.mock("../actions/update-admission-activity.action", () => ({
  updateAdmissionActivityAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("ActivityComposer", () => {
  it("defaults to the Notiz tab first (design tab order: Notiz · Anruf · E-Mail)", () => {
    render(
      <ActivityComposer applicationId="app-1" onSaved={vi.fn()} />,
    );
    const tabs = screen
      .getAllByRole("button")
      .filter((b) =>
        ["activityTypeNote", "activityTypeCall", "activityTypeEmail"].some(
          (k) => b.textContent === k,
        ),
      );
    expect(tabs.map((b) => b.textContent)).toEqual([
      "activityTypeNote",
      "activityTypeCall",
      "activityTypeEmail",
    ]);
  });

  it("renders the generic subject field (no With/Outcome) in Notiz mode", () => {
    render(<ActivityComposer applicationId="app-1" onSaved={vi.fn()} />);
    expect(screen.getByText("activitySubject")).toBeInTheDocument();
    expect(screen.queryByText("activityWith")).not.toBeInTheDocument();
    expect(screen.queryByText("activityOutcome")).not.toBeInTheDocument();
  });

  it("switching to Anruf shows Mit / Wann / Richtung; Ergebnis only when outbound", async () => {
    const user = userEvent.setup();
    render(<ActivityComposer applicationId="app-1" onSaved={vi.fn()} />);

    await user.click(screen.getByText("activityTypeCall"));

    // "Mit" replaces the generic "Betreff" label for calls.
    expect(screen.getByText("activityWith")).toBeInTheDocument();
    expect(screen.queryByText("activitySubject")).not.toBeInTheDocument();
    // "Wann" — the combined date+time control (button trigger, not a native input).
    expect(screen.getByText("activityOccurredAt")).toBeInTheDocument();
    // Direction pills (Eingehend/Ausgehend).
    expect(screen.getByText("activityDirection")).toBeInTheDocument();
    expect(screen.getByText("activityDirectionInbound")).toBeInTheDocument();
    expect(screen.getByText("activityDirectionOutbound")).toBeInTheDocument();
    // Outcome is hidden until the call is marked outbound.
    expect(screen.queryByText("activityOutcome")).not.toBeInTheDocument();

    await user.click(screen.getByText("activityDirectionOutbound"));

    // Outcome pills (Erreicht/Nicht erreicht/Rückruf vereinbart) appear now.
    expect(screen.getByText("activityOutcome")).toBeInTheDocument();
    expect(screen.getByText("activityOutcomeReached")).toBeInTheDocument();
    expect(screen.getByText("activityOutcomeNotReached")).toBeInTheDocument();
    expect(
      screen.getByText("activityOutcomeCallbackArranged"),
    ).toBeInTheDocument();
  });

  it("outcome is hidden for an inbound call", async () => {
    const user = userEvent.setup();
    render(<ActivityComposer applicationId="app-1" onSaved={vi.fn()} />);
    await user.click(screen.getByText("activityTypeCall"));
    await user.click(screen.getByText("activityDirectionInbound"));
    expect(screen.queryByText("activityOutcome")).not.toBeInTheDocument();
  });

  it("toggles a call outcome pill on click (outbound)", async () => {
    const user = userEvent.setup();
    render(<ActivityComposer applicationId="app-1" onSaved={vi.fn()} />);
    await user.click(screen.getByText("activityTypeCall"));
    await user.click(screen.getByText("activityDirectionOutbound"));

    const reached = screen.getByText("activityOutcomeReached");
    expect(reached).toHaveClass("border-border");
    await user.click(reached);
    expect(reached).toHaveClass("bg-primary");
  });

  it("outbound 'Nicht erreicht' → reminder panel; 'Rückruf vereinbart' → appointment panel", async () => {
    const user = userEvent.setup();
    render(
      <ActivityComposer
        applicationId="app-1"
        onSaved={vi.fn()}
        members={[{ id: "m1", name: "Lea Lehr" }]}
        appointmentTypes={[
          { id: "t1", label: "Schnuppertag", color: null, position: 0 },
        ]}
      />,
    );
    await user.click(screen.getByText("activityTypeCall"));
    await user.click(screen.getByText("activityDirectionOutbound"));
    // No follow-up panel until an outcome is chosen.
    expect(
      screen.queryByText("activityFollowUpReminder"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("activityFollowUpAppointment"),
    ).not.toBeInTheDocument();

    // "Nicht erreicht" → reminder panel (call again later).
    await user.click(screen.getByText("activityOutcomeNotReached"));
    expect(screen.getByText("activityFollowUpReminder")).toBeInTheDocument();
    expect(
      screen.queryByText("activityFollowUpAppointment"),
    ).not.toBeInTheDocument();

    // "Rückruf vereinbart" → appointment panel instead.
    await user.click(screen.getByText("activityOutcomeCallbackArranged"));
    expect(
      screen.getByText("activityFollowUpAppointment"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("activityFollowUpReminder"),
    ).not.toBeInTheDocument();
  });

  it("switching to E-Mail shows direction but not With/Outcome", async () => {
    const user = userEvent.setup();
    render(<ActivityComposer applicationId="app-1" onSaved={vi.fn()} />);
    await user.click(screen.getByText("activityTypeEmail"));

    expect(screen.getByText("activityDirection")).toBeInTheDocument();
    expect(screen.queryByText("activityWith")).not.toBeInTheDocument();
    expect(screen.queryByText("activityOutcome")).not.toBeInTheDocument();
  });

  it("Anruf: offers a contact dropdown when withOptions are given", async () => {
    const user = userEvent.setup();
    render(
      <ActivityComposer
        applicationId="app-1"
        onSaved={vi.fn()}
        withOptions={[
          { id: "c1", name: "Anna Muster", role: "Mutter" },
          { id: "c2", name: "Ben Muster", role: null },
        ]}
      />,
    );
    await user.click(screen.getByText("activityTypeCall"));
    // A select trigger (combobox) replaces the free subject input; the
    // placeholder proves the contact dropdown (not the free input) is shown.
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("activityWithSelect")).toBeInTheDocument();
  });

  it("Anruf: choosing 'Andere' reveals a free name input", async () => {
    const user = userEvent.setup();
    render(
      <ActivityComposer
        applicationId="app-1"
        onSaved={vi.fn()}
        withOptions={[{ id: "c1", name: "Anna Muster", role: null }]}
      />,
    );
    await user.click(screen.getByText("activityTypeCall"));
    // Select "Andere" via the native select the Radix trigger mirrors.
    const nativeSelect = document.querySelector(
      "select",
    ) as HTMLSelectElement | null;
    expect(nativeSelect).not.toBeNull();
    await user.selectOptions(nativeSelect!, "__other__");
    expect(
      screen.getByPlaceholderText("activityWithOtherPlaceholder"),
    ).toBeInTheDocument();
  });

  it("has no native date/time inputs (uses the calendar+slots control)", () => {
    render(<ActivityComposer applicationId="app-1" onSaved={vi.fn()} />);
    expect(document.querySelector('input[type="date"]')).toBeNull();
    expect(document.querySelector('input[type="time"]')).toBeNull();
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull();
  });
});
