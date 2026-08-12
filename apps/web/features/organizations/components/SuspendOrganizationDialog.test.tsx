import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SuspendOrganizationDialog } from "./SuspendOrganizationDialog";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const suspendOrganizationAction = vi.fn();
vi.mock("../actions/suspend-organization.action", () => ({
  suspendOrganizationAction: (...args: unknown[]) =>
    suspendOrganizationAction(...args),
}));

describe("SuspendOrganizationDialog", () => {
  beforeEach(() => {
    suspendOrganizationAction.mockReset();
  });

  it("shows a validation error and does not submit when the reason is empty", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <SuspendOrganizationDialog
        organizationId="org-1"
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByText("suspendConfirm"));

    expect(screen.getByText("suspendReasonRequired")).toBeInTheDocument();
    expect(suspendOrganizationAction).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("submits the trimmed reason, closes the dialog and calls onSuccess on success", async () => {
    suspendOrganizationAction.mockResolvedValueOnce({
      success: true,
      data: { id: "org-1", lifecycleStatus: "SUSPENDED" },
    });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    render(
      <SuspendOrganizationDialog
        organizationId="org-1"
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    await user.type(
      screen.getByLabelText("suspendReasonLabel"),
      "  non-payment  "
    );
    await user.click(screen.getByText("suspendConfirm"));

    expect(suspendOrganizationAction).toHaveBeenCalledWith(
      "org-1",
      "non-payment"
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });

  it("keeps the dialog open and does not call onSuccess when the action fails", async () => {
    suspendOrganizationAction.mockResolvedValueOnce({
      success: false,
      error: "server error",
    });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    render(
      <SuspendOrganizationDialog
        organizationId="org-1"
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    await user.type(screen.getByLabelText("suspendReasonLabel"), "reason");
    await user.click(screen.getByText("suspendConfirm"));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
