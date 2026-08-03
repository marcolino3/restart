import { describe, expect, it } from "vitest";
import { EmployeeContractFormSchema } from "@restart/shared-schemas/employees/employee-contract-form.schema";
import { END_DATE_BEFORE_START_MESSAGE } from "@restart/shared-schemas/employees/contract-date-rules";

describe("EmployeeContractFormSchema date coercion", () => {
  const base = {
    employeeId: "8c45e8ad-e76d-4d52-9eed-4221dfd0967c",
    contractType: "TEMPORARY" as const,
    position: "Lehrperson",
    workloadPercent: 60,
    weeklyHours: "42",
    grossSalary: 5000,
    has13thSalary: false,
    paymentInterval: "" as const,
    annualVacationDays: 25,
    weekdayTimeWindows: {},
    weekdayWorkloads: {},
  };

  it("accepts Date instances", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...base,
      startDate: new Date("2026-08-03T12:00:00.000Z"),
      endDate: new Date("2027-07-31T12:00:00.000Z"),
    });
    expect(result.success).toBe(true);
  });

  it("accepts ISO strings from server-action serialization", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...base,
      startDate: "2026-08-03T12:00:00.000Z",
      endDate: "2027-07-31T12:00:00.000Z",
      probationEndDate: "2026-11-03T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.probationEndDate).toBeInstanceOf(Date);
    }
  });

  it("rejects endDate before startDate", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...base,
      startDate: new Date("2026-08-03T12:00:00.000Z"),
      endDate: new Date("2026-07-01T12:00:00.000Z"),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "endDate")).toBe(
        true,
      );
      expect(
        result.error.issues.some(
          (i) => i.message === END_DATE_BEFORE_START_MESSAGE,
        ),
      ).toBe(true);
    }
  });

  it("allows endDate on the same calendar day as startDate", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...base,
      startDate: new Date("2026-08-03T08:00:00.000Z"),
      endDate: new Date("2026-08-03T18:00:00.000Z"),
    });
    expect(result.success).toBe(true);
  });
});
