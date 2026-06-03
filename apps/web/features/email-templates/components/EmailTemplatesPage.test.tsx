import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EmailTemplatesPage } from "./EmailTemplatesPage";
import type { EmailTemplate } from "../actions/get-email-templates.action";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("../actions/mutate-email-template.action", () => ({
  deleteEmailTemplateAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Stub the heavy dialog (contains the Tiptap editor) — we only assert it opens.
vi.mock("./EmailTemplateDialog", () => ({
  EmailTemplateDialog: ({ open }: { open: boolean }) =>
    open ? <div>template-dialog</div> : null,
}));
vi.mock("@/components/common/DeleteConfirmationDialog", () => ({
  DeleteConfirmationDialog: () => <button>delete</button>,
}));

const template = (overrides: Partial<EmailTemplate> = {}): EmailTemplate => ({
  id: "tpl-1",
  name: "Welcome",
  category: "ADMISSION",
  subject: "Hello {{childFirstName}}",
  bodyHtml: "<p>Hi</p>",
  description: null,
  createdAt: "2030-01-01T00:00:00.000Z",
  updatedAt: "2030-01-01T00:00:00.000Z",
  ...overrides,
});

describe("EmailTemplatesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders templates with their subject", () => {
    render(
      <EmailTemplatesPage
        initialTemplates={[
          template(),
          template({ id: "tpl-2", name: "Reject", subject: "Sorry" }),
        ]}
        canManage
      />,
    );
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
    expect(screen.getByText("Hello {{childFirstName}}")).toBeInTheDocument();
  });

  it("shows the empty state when there are no templates", () => {
    render(<EmailTemplatesPage initialTemplates={[]} canManage />);
    expect(screen.getByText("emptyState")).toBeInTheDocument();
  });

  it("opens the dialog when clicking 'new template'", async () => {
    const user = userEvent.setup();
    render(<EmailTemplatesPage initialTemplates={[]} canManage />);
    expect(screen.queryByText("template-dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "newTemplate" }));
    expect(screen.getByText("template-dialog")).toBeInTheDocument();
  });

  it("hides management actions when canManage is false", () => {
    render(
      <EmailTemplatesPage initialTemplates={[template()]} canManage={false} />,
    );
    expect(
      screen.queryByRole("button", { name: "newTemplate" }),
    ).not.toBeInTheDocument();
  });
});
