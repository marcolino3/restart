import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChangePlanDialog } from "./ChangePlanDialog";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const changeOrganizationPlanAction = vi.fn();
vi.mock("../actions/change-organization-plan.action", () => ({
  changeOrganizationPlanAction: (...args: unknown[]) =>
    changeOrganizationPlanAction(...args),
}));

describe("ChangePlanDialog", () => {
  beforeEach(() => {
    changeOrganizationPlanAction.mockReset();
  });

  it("submits current field values, closes the dialog and calls onSuccess on success", async () => {
    changeOrganizationPlanAction.mockResolvedValueOnce({
      success: true,
      data: { id: "org-1", plan: "STARTER" },
    });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ChangePlanDialog
        organizationId="org-1"
        currentPlan="STARTER"
        currentUserLicenseLimit={50}
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    await user.clear(screen.getByLabelText("sidebarUserLicenses"));
    await user.type(screen.getByLabelText("sidebarUserLicenses"), "80");
    await user.click(screen.getByText("sidebarChangePlan"));

    expect(changeOrganizationPlanAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "org-1",
        plan: "STARTER",
        userLicenseLimit: 80,
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });

  it("does not close the dialog or call onSuccess when the action fails", async () => {
    changeOrganizationPlanAction.mockResolvedValueOnce({
      success: false,
      error: "server error",
    });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ChangePlanDialog
        organizationId="org-1"
        currentPlan="STARTER"
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    await user.click(screen.getByText("sidebarChangePlan"));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onOpenChange(false) without submitting when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <ChangePlanDialog
        organizationId="org-1"
        currentPlan="STARTER"
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByText("cancel"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(changeOrganizationPlanAction).not.toHaveBeenCalled();
  });
});
