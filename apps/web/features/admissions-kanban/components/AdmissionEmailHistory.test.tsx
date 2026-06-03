import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AdmissionEmailHistory } from "./AdmissionEmailHistory";
import type { AdmissionEmail } from "../actions/get-admission-emails.action";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}:${JSON.stringify(vars)}` : key,
}));

const resendAction = vi.fn();
const deleteAction = vi.fn();
vi.mock("../actions/mutate-admission-email.action", () => ({
  resendAdmissionEmailAction: (...a: unknown[]) => resendAction(...a),
  deleteAdmissionEmailAction: (...a: unknown[]) => deleteAction(...a),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const email = (overrides: Partial<AdmissionEmail> = {}): AdmissionEmail => ({
  id: "e-1",
  toEmail: "parent@example.com",
  toName: "Familie Muster",
  subject: "Willkommen",
  bodyHtml: "<p>Hallo</p>",
  status: "SENT",
  errorMessage: null,
  sentAt: "2030-01-01T10:00:00.000Z",
  templateName: "Welcome",
  sentByName: "Lea Lehrer",
  ...overrides,
});

const baseProps = {
  applicationId: "app-1",
  canManage: true,
  onChanged: vi.fn(),
};

describe("AdmissionEmailHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the empty state when there are no emails", () => {
    render(<AdmissionEmailHistory {...baseProps} emails={[]} />);
    expect(screen.getByText("emailHistoryEmpty")).toBeInTheDocument();
  });

  it("always shows who sent the email (author)", () => {
    render(
      <AdmissionEmailHistory {...baseProps} emails={[email()]} />,
    );
    // emailSentBy is rendered with the sender name interpolated.
    expect(
      screen.getByText(/emailSentBy:.*Lea Lehrer/),
    ).toBeInTheDocument();
  });

  it("renders sent and failed emails with status + error reason", () => {
    render(
      <AdmissionEmailHistory
        {...baseProps}
        emails={[
          email({ id: "ok", subject: "Sent one", status: "SENT" }),
          email({
            id: "bad",
            subject: "Failed one",
            status: "FAILED",
            errorMessage: "SMTP down",
          }),
        ]}
      />,
    );
    expect(screen.getByText("emailStatusSent")).toBeInTheDocument();
    expect(screen.getByText("emailStatusFailed")).toBeInTheDocument();
    expect(screen.getByText("SMTP down")).toBeInTheDocument();
  });

  it("shows a resend button only for failed emails and calls the action", async () => {
    const user = userEvent.setup();
    resendAction.mockResolvedValue({
      success: true,
      status: "SENT",
      errorMessage: null,
    });
    const onChanged = vi.fn();
    render(
      <AdmissionEmailHistory
        {...baseProps}
        onChanged={onChanged}
        emails={[email({ id: "bad", status: "FAILED" })]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /emailResend/i }));
    await waitFor(() =>
      expect(resendAction).toHaveBeenCalledWith("bad", "app-1"),
    );
    expect(onChanged).toHaveBeenCalled();
  });

  it("does not show a resend button for sent emails", () => {
    render(
      <AdmissionEmailHistory
        {...baseProps}
        emails={[email({ status: "SENT" })]}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /emailResend/i }),
    ).not.toBeInTheDocument();
  });

  it("hides actions when canManage is false", () => {
    render(
      <AdmissionEmailHistory
        {...baseProps}
        canManage={false}
        emails={[email({ status: "FAILED" })]}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /emailResend/i }),
    ).not.toBeInTheDocument();
  });

  it("expands an email to render its body in a sandboxed iframe", async () => {
    const user = userEvent.setup();
    render(
      <AdmissionEmailHistory
        {...baseProps}
        emails={[email({ subject: "Click me" })]}
      />,
    );
    expect(screen.queryByTitle("emailBodyPreview")).not.toBeInTheDocument();
    await user.click(screen.getByText("Click me"));
    const iframe = screen.getByTitle("emailBodyPreview");
    expect(iframe).toHaveAttribute("sandbox", "");
    expect(iframe).toHaveAttribute("srcdoc", "<p>Hallo</p>");
  });
});
