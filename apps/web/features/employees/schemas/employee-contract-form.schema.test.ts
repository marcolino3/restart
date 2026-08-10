import { describe, it, expect } from "vitest";

import {
  EmployeeContractFormSchema,
  buildEmployeeContractFormSchema,
} from "./employee-contract-form.schema";

const baseValues = {
  employeeId: "11111111-1111-4111-8111-111111111111",
  startDate: new Date("2026-01-01"),
  endDate: null,
  probationEndDate: null,
  contractType: "PERMANENT" as const,
  position: "",
  supervisorMembershipId: null,
  workloadPercent: 100,
  weeklyHours: "42",
  grossSalary: null,
  hourlyRate: null,
  paymentInterval: "MONTHLY_X12" as const,
  has13thSalary: false,
  annualVacationDays: 25,
  remainingVacationDays: "",
  notes: "",
  documentUrl: "",
  weekdayTimeWindows: {},
  weekdayWorkloads: {},
};

describe("EmployeeContractFormSchema", () => {
  it("flags grossSalary as required for a PERMANENT contract when left blank", () => {
    const result = EmployeeContractFormSchema.safeParse(baseValues);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "grossSalary"),
      ).toBe(true);
    }
  });
});

describe("buildEmployeeContractFormSchema", () => {
  it("does not require a field the user has no read permission for, even if the contract type would otherwise require it", () => {
    const schema = buildEmployeeContractFormSchema(new Set(["grossSalary"]));
    const result = schema.safeParse(baseValues);
    expect(result.success).toBe(true);
  });

  it("still requires fields not hidden by permission", () => {
    // TEMPORARY requires both endDate and grossSalary; only grossSalary is hidden.
    const schema = buildEmployeeContractFormSchema(new Set(["grossSalary"]));
    const result = schema.safeParse({
      ...baseValues,
      contractType: "TEMPORARY",
      endDate: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "endDate"),
      ).toBe(true);
      expect(
        result.error.issues.some((issue) => issue.path[0] === "grossSalary"),
      ).toBe(false);
    }
  });

  it("behaves like the base schema when no field is hidden", () => {
    const schema = buildEmployeeContractFormSchema(new Set());
    const result = schema.safeParse(baseValues);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "grossSalary"),
      ).toBe(true);
    }
  });
});
