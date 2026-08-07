import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { MyTimeTrackingView } from "./MyTimeTrackingView";
import type { MyTimeTrackingData } from "../types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}:${JSON.stringify(vars)}` : key,
  useLocale: () => "de",
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/providers/sheet-provider", () => ({
  useSheet: () => ({ open: vi.fn(), close: vi.fn() }),
}));

const baseData: MyTimeTrackingData = {
  employeeId: "emp-1",
  balance: null,
  vacation: null,
  entries: [],
  openEntry: null,
  missingRecordDays: [],
  monthlyGroups: [],
  fromDate: "2026-01-01",
  toDate: "2026-12-31",
};

describe("MyTimeTrackingView", () => {
  it("shows the no-profile message when the caller has no employee profile", () => {
    render(<MyTimeTrackingView data={{ ...baseData, employeeId: null }} />);
    expect(screen.getByText("noTimeTrackingProfile")).toBeInTheDocument();
  });

  it("shows a missing-records warning with the day count when there are gaps", () => {
    render(
      <MyTimeTrackingView
        data={{ ...baseData, missingRecordDays: ["2026-01-05", "2026-01-06"] }}
      />,
    );
    expect(
      screen.getByText('missingRecords:{"count":2}'),
    ).toBeInTheDocument();
  });

  it("does not show the missing-records warning when there are no gaps", () => {
    render(<MyTimeTrackingView data={baseData} />);
    expect(screen.queryByText(/missingRecords/)).not.toBeInTheDocument();
  });
});
