import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SendEmailDialog } from "./SendEmailDialog";

// ── module mocks ───────────────────────────────────────────────────
const previewAction = vi.fn();
const sendAction = vi.fn();
vi.mock("../actions/preview-admission-email.action", () => ({
  previewAdmissionEmailAction: (...args: unknown[]) => previewAction(...args),
}));
vi.mock("../actions/send-admission-email.action", () => ({
  sendAdmissionEmailAction: (...args: unknown[]) => sendAction(...args),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

// Avoid pulling Tiptap/ProseMirror into jsdom — the body value is set
// programmatically by the preview, not by user typing.
vi.mock("@/components/form/form-fields/EditorFormField", () => ({
  EditorFormField: () => <div data-testid="editor" />,
}));

// Replace the Radix Select with a button that fires onValueChange("tpl-1").
vi.mock("@/components/ui/select", () => ({
  Select: ({
    onValueChange,
  }: {
    onValueChange: (v: string) => void;
    children?: React.ReactNode;
  }) => (
    <button type="button" onClick={() => onValueChange("tpl-1")}>
      pick-template
    </button>
  ),
  SelectContent: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectTrigger: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
}));

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  applicationId: "app-1",
  templates: [{ id: "tpl-1", name: "Welcome" }],
  contacts: [
    { id: "c-mother", name: "Anna Muster", email: "anna@example.com", role: "MOTHER" },
    { id: "c-father", name: "Beat Muster", email: "beat@example.com", role: "FATHER" },
  ],
  defaultToEmail: "anna@example.com",
  defaultToName: "Anna Muster",
  onSent: vi.fn(),
};

const preview = {
  subject: "Hallo Mia",
  bodyHtml: "<p>Body</p>",
  toEmail: "mia@example.com",
  toName: "Mia",
  availableVariables: [],
};

describe("SendEmailDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads a preview when a template is selected and prefills the subject", async () => {
    const user = userEvent.setup();
    previewAction.mockResolvedValue({ success: true, data: preview });

    render(<SendEmailDialog {...baseProps} />);
    await user.click(screen.getByText("pick-template"));

    expect(previewAction).toHaveBeenCalledWith("app-1", "tpl-1");
    await waitFor(() =>
      expect(screen.getByDisplayValue("Hallo Mia")).toBeInTheDocument(),
    );
  });

  it("lets the user pick a different recipient (Vater/Mutter)", async () => {
    const user = userEvent.setup();
    render(<SendEmailDialog {...baseProps} />);

    // Defaults to the mother (matches defaultToEmail).
    expect(screen.getByDisplayValue("anna@example.com")).toBeInTheDocument();

    // Pick the father → email + name fields update.
    await user.click(screen.getByRole("button", { name: /Beat Muster/ }));
    expect(screen.getByDisplayValue("beat@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Beat Muster")).toBeInTheDocument();
  });

  it("sends the email and reports success", async () => {
    const user = userEvent.setup();
    previewAction.mockResolvedValue({ success: true, data: preview });
    sendAction.mockResolvedValue({
      success: true,
      status: "SENT",
      errorMessage: null,
    });
    const onSent = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <SendEmailDialog
        {...baseProps}
        onSent={onSent}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByText("pick-template"));
    await waitFor(() =>
      expect(screen.getByDisplayValue("Hallo Mia")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /emailSend/i }));

    await waitFor(() => expect(sendAction).toHaveBeenCalledTimes(1));
    expect(sendAction).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: "app-1",
        templateId: "tpl-1",
        subject: "Hallo Mia",
      }),
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onSent).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("surfaces a delivery failure as an error toast (tracking still recorded)", async () => {
    const user = userEvent.setup();
    previewAction.mockResolvedValue({ success: true, data: preview });
    sendAction.mockResolvedValue({
      success: true,
      status: "FAILED",
      errorMessage: "SMTP down",
    });
    const onSent = vi.fn();

    render(<SendEmailDialog {...baseProps} onSent={onSent} />);
    await user.click(screen.getByText("pick-template"));
    await waitFor(() =>
      expect(screen.getByDisplayValue("Hallo Mia")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /emailSend/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    // The attempt is still tracked, so the history is refreshed.
    expect(onSent).toHaveBeenCalled();
  });
});
