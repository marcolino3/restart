import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuditLogSheet } from "./AuditLogSheet";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "de",
}));

const getOrganizationAuditLogAction = vi.fn();
vi.mock("../actions/get-organization-audit-log.action", () => ({
  getOrganizationAuditLogAction: (...args: unknown[]) =>
    getOrganizationAuditLogAction(...args),
}));

describe("AuditLogSheet", () => {
  beforeEach(() => {
    getOrganizationAuditLogAction.mockReset();
  });

  it("loads the first page scoped to the given organization when opened", async () => {
    getOrganizationAuditLogAction.mockResolvedValueOnce({
      success: true,
      data: { items: [], total: 0 },
    });

    render(
      <AuditLogSheet organizationId="org-1" open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() =>
      expect(getOrganizationAuditLogAction).toHaveBeenCalledWith(
        "org-1",
        25,
        0
      )
    );
  });

  it("does not load when the sheet is closed", () => {
    render(
      <AuditLogSheet
        organizationId="org-1"
        open={false}
        onOpenChange={vi.fn()}
      />
    );

    expect(getOrganizationAuditLogAction).not.toHaveBeenCalled();
  });

  it("renders entries once loaded", async () => {
    getOrganizationAuditLogAction.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: "log-1",
            action: "SUSPENDED",
            createdAt: "2026-01-01T10:00:00.000Z",
            actorUser: { id: "u1", firstName: "Anna", lastName: "Meier" },
          },
        ],
        total: 1,
      },
    });

    render(
      <AuditLogSheet organizationId="org-1" open={true} onOpenChange={vi.fn()} />
    );

    expect(await screen.findByText("auditAction_SUSPENDED")).toBeInTheDocument();
    expect(screen.getByText("Anna Meier")).toBeInTheDocument();
  });

  it("shows the empty state when there are no entries", async () => {
    getOrganizationAuditLogAction.mockResolvedValueOnce({
      success: true,
      data: { items: [], total: 0 },
    });

    render(
      <AuditLogSheet organizationId="org-1" open={true} onOpenChange={vi.fn()} />
    );

    expect(await screen.findByText("auditLogEmpty")).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    getOrganizationAuditLogAction.mockResolvedValueOnce({
      success: false,
      error: "network down",
    });

    render(
      <AuditLogSheet organizationId="org-1" open={true} onOpenChange={vi.fn()} />
    );

    expect(await screen.findByText("auditLogLoadError")).toBeInTheDocument();
  });

  it("requests the next page scoped to the same organization on pagination", async () => {
    getOrganizationAuditLogAction.mockResolvedValueOnce({
      success: true,
      data: {
        items: [{ id: "log-1", action: "SUSPENDED", createdAt: "2026-01-01T10:00:00.000Z" }],
        total: 30,
      },
    });
    getOrganizationAuditLogAction.mockResolvedValueOnce({
      success: true,
      data: {
        items: [{ id: "log-2", action: "REACTIVATED", createdAt: "2026-01-02T10:00:00.000Z" }],
        total: 30,
      },
    });

    const user = userEvent.setup();
    render(
      <AuditLogSheet organizationId="org-1" open={true} onOpenChange={vi.fn()} />
    );

    await screen.findByText("auditAction_SUSPENDED");
    await user.click(screen.getByText(">"));

    await waitFor(() =>
      expect(getOrganizationAuditLogAction).toHaveBeenLastCalledWith(
        "org-1",
        25,
        25
      )
    );
  });
});
