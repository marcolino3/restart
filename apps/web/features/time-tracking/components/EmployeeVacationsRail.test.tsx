import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EmployeeVacationsRail from "./EmployeeVacationsRail";
import type { EmployeeCompanyVacation } from "../actions/company-vacation-assignments.action";
import type { EmployeeVacationSegment } from "../actions/employee-vacations.action";
import type { CompanyVacation, Holiday } from "../actions/settings.action";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  useLocale: () => "de",
}));

const assignCompanyVacationAction = vi.fn();
const unassignCompanyVacationAction = vi.fn();
vi.mock("../actions/company-vacation-assignments.action", () => ({
  assignCompanyVacationAction: (...args: unknown[]) =>
    assignCompanyVacationAction(...args),
  unassignCompanyVacationAction: (...args: unknown[]) =>
    unassignCompanyVacationAction(...args),
}));

const createEmployeeVacationAction = vi.fn();
const deleteEmployeeVacationAction = vi.fn();
vi.mock("../actions/employee-vacations.action", () => ({
  createEmployeeVacationAction: (...args: unknown[]) =>
    createEmployeeVacationAction(...args),
  deleteEmployeeVacationAction: (...args: unknown[]) =>
    deleteEmployeeVacationAction(...args),
}));

const assigned: EmployeeCompanyVacation[] = [
  {
    id: "assigned-1",
    companyVacationId: "cv-1",
    name: "Sommerferien",
    startDate: "2026-07-01",
    endDate: "2026-07-14",
    effectiveDays: 10,
    holidays: [],
    periodLabel: "2026",
    periodStartDate: "2026-01-01",
    periodEndDate: "2026-12-31",
    isSplit: false,
  },
];

const allCompanyVacations: CompanyVacation[] = [
  {
    id: "cv-1",
    name: "Sommerferien",
    startDate: "2026-07-01",
    endDate: "2026-07-14",
    effectiveDays: 10,
    holidays: [],
  },
  {
    id: "cv-2",
    name: "Herbstferien",
    startDate: "2026-10-01",
    endDate: "2026-10-10",
    effectiveDays: 7,
    holidays: [],
  },
];

const individualVacations: EmployeeVacationSegment[] = [];

const holidays: Holiday[] = [
  {
    id: "h-1",
    date: "2099-12-24",
    name: "Weihnachten",
    paidPercentage: 100,
    repeatsYearly: true,
  },
];

describe("EmployeeVacationsRail", () => {
  it("renders assigned company vacations with the assigned/remaining summary", () => {
    render(
      <EmployeeVacationsRail
        employeeId="emp-1"
        assigned={assigned}
        allCompanyVacations={allCompanyVacations}
        individualVacations={individualVacations}
        holidays={holidays}
        remainingVacationDays={12}
        editable
      />,
    );
    expect(screen.getByText("Sommerferien")).toBeInTheDocument();
    expect(screen.getByText("mz.assignedTotal")).toBeInTheDocument();
    expect(screen.getByText("10 mz.daysUnit")).toBeInTheDocument();
    expect(screen.getByText("12 mz.daysUnit")).toBeInTheDocument();
  });

  it("lists only unassigned company vacations as assignable and assigns the selected one", async () => {
    assignCompanyVacationAction.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <EmployeeVacationsRail
        employeeId="emp-1"
        assigned={assigned}
        allCompanyVacations={allCompanyVacations}
        individualVacations={individualVacations}
        holidays={holidays}
        remainingVacationDays={12}
        editable
      />,
    );

    await user.click(screen.getByTitle("mz.manageCompanyVacations"));
    expect(screen.queryByText("Sommerferien", { selector: "span" })).not.toBeInTheDocument();
    await user.click(screen.getByText("Herbstferien"));
    await user.click(screen.getByText("vacations.assignSelected"));

    expect(assignCompanyVacationAction).toHaveBeenCalledWith("cv-2", "emp-1");
  });

  it("shows the upcoming closures panel from holidays", () => {
    render(
      <EmployeeVacationsRail
        employeeId="emp-1"
        assigned={[]}
        allCompanyVacations={allCompanyVacations}
        individualVacations={individualVacations}
        holidays={holidays}
        remainingVacationDays={null}
        editable={false}
      />,
    );
    expect(screen.getByText("Weihnachten")).toBeInTheDocument();
  });
});
