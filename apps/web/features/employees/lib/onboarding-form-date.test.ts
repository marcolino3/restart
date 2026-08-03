import { describe, expect, it } from "vitest";
import { EmployeeOnboardingFormSchema } from "@restart/shared-schemas/employees/employee-onboarding-form.schema";
import { END_DATE_BEFORE_START_MESSAGE } from "@restart/shared-schemas/employees/contract-date-rules";

const base = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@school.ch",
};

describe("EmployeeOnboardingFormSchema date coercion", () => {
  it("accepts ISO strings for start, end and probation dates", () => {
    const result = EmployeeOnboardingFormSchema.safeParse({
      ...base,
      startDate: "2026-08-03T12:00:00.000Z",
      endDate: "2027-07-31T12:00:00.000Z",
      probationEndDate: "2026-11-03T12:00:00.000Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.endDate).toBeInstanceOf(Date);
      expect(result.data.probationEndDate).toBeInstanceOf(Date);
    }
  });

  it("rejects endDate before startDate", () => {
    const result = EmployeeOnboardingFormSchema.safeParse({
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

  it("allows a missing endDate", () => {
    const result = EmployeeOnboardingFormSchema.safeParse({
      ...base,
      startDate: new Date("2026-08-03T12:00:00.000Z"),
      endDate: null,
    });

    expect(result.success).toBe(true);
  });
});
