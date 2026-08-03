import { describe, expect, it } from "vitest";
import {
  EMPLOYEE_CONTRACT_TYPES,
  CONTRACT_TYPE_RULES,
  isContractFieldRequired,
  isContractFieldVisible,
  missingRequiredContractFields,
} from "@restart/shared-schemas/employees/contract-type-rules";
import {
  EmployeeContractFormSchema,
  clearHiddenContractFormFields,
} from "./employee-contract-form.schema";

const employeeId = "11111111-1111-4111-8111-111111111111";

const baseValues = {
  employeeId,
  startDate: new Date("2026-08-01"),
};

describe("contract type rules", () => {
  it("defines rules for every contract type", () => {
    for (const type of EMPLOYEE_CONTRACT_TYPES) {
      expect(CONTRACT_TYPE_RULES[type]).toBeDefined();
    }
  });

  it("keeps all fields visible while no type is selected", () => {
    expect(isContractFieldVisible("", "grossSalary")).toBe(true);
    expect(isContractFieldVisible("", "hourlyRate")).toBe(true);
    expect(missingRequiredContractFields({}, "")).toEqual([]);
  });

  it("hides the monthly salary for hourly contracts and vice versa", () => {
    expect(isContractFieldVisible("HOURLY", "grossSalary")).toBe(false);
    expect(isContractFieldVisible("HOURLY", "hourlyRate")).toBe(true);
    expect(isContractFieldVisible("PERMANENT", "hourlyRate")).toBe(false);
    expect(isContractFieldVisible("PERMANENT", "grossSalary")).toBe(true);
  });

  it("hides vacation entitlement for hourly, substitute and freelance", () => {
    for (const type of ["HOURLY", "SUBSTITUTE", "EXTERNAL"]) {
      expect(isContractFieldVisible(type, "annualVacationDays")).toBe(false);
      expect(isContractFieldVisible(type, "has13thSalary")).toBe(false);
    }
  });

    it("hides the workload percentage where staff are paid by the hour", () => {
    for (const type of ["HOURLY", "SUBSTITUTE", "EXTERNAL"]) {
      expect(isContractFieldVisible(type, "workloadPercent")).toBe(false);
      expect(isContractFieldVisible(type, "weeklyHours")).toBe(false);
    }
    for (const type of ["PERMANENT", "TEMPORARY", "APPRENTICESHIP"]) {
      expect(isContractFieldVisible(type, "workloadPercent")).toBe(true);
      expect(isContractFieldVisible(type, "weeklyHours")).toBe(true);
      expect(isContractFieldRequired(type, "workloadPercent")).toBe(false);
    }
  });

  it("requires an end date for fixed-term-like contracts", () => {
    for (const type of [
      "TEMPORARY",
      "INTERNSHIP",
      "APPRENTICESHIP",
      "SUBSTITUTE",
    ]) {
      expect(isContractFieldRequired(type, "endDate")).toBe(true);
    }
    expect(isContractFieldRequired("PERMANENT", "endDate")).toBe(false);
  });
});

describe("EmployeeContractFormSchema", () => {
  it("rejects a fixed-term contract without an end date", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...baseValues,
      contractType: "TEMPORARY",
      grossSalary: 6000,
    });

    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((i) => i.path.join(".")),
    ).toContain("endDate");
  });

  it("accepts a fixed-term contract with end date and salary", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...baseValues,
      contractType: "TEMPORARY",
      endDate: new Date("2027-07-31"),
      grossSalary: 6000,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a permanent contract without a gross salary", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...baseValues,
      contractType: "PERMANENT",
    });

    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((i) => i.path.join(".")),
    ).toContain("grossSalary");
  });

  it("rejects an hourly contract without an hourly rate", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...baseValues,
      contractType: "HOURLY",
      grossSalary: 6000,
    });

    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((i) => i.path.join(".")),
    ).toContain("hourlyRate");
  });

  it("accepts a fractional workload percentage", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...baseValues,
      contractType: "PERMANENT",
      grossSalary: 6000,
      workloadPercent: "53.2",
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.workloadPercent : null).toBe(53.2);
  });

  it("rejects a workload above 100 percent", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...baseValues,
      contractType: "PERMANENT",
      grossSalary: 6000,
      workloadPercent: 120,
    });

    expect(result.success).toBe(false);
  });

  it("stays permissive while no contract type is chosen", () => {
    const result = EmployeeContractFormSchema.safeParse({
      ...baseValues,
      contractType: "",
    });

    expect(result.success).toBe(true);
  });
});

describe("clearHiddenContractFormFields", () => {
  it("drops fields that do not apply to the chosen type", () => {
    const values = clearHiddenContractFormFields({
      contractType: "HOURLY",
      grossSalary: 6000,
      hourlyRate: 45,
      has13thSalary: true,
      annualVacationDays: 25,
      probationEndDate: new Date("2026-10-31"),
      workloadPercent: 53.2,
      weeklyHours: "42",
    });

    expect(values.grossSalary).toBeNull();
    expect(values.has13thSalary).toBeNull();
    expect(values.annualVacationDays).toBeNull();
    expect(values.probationEndDate).toBeNull();
    expect(values.workloadPercent).toBeNull();
    expect(values.weeklyHours).toBeNull();
    expect(values.hourlyRate).toBe(45);
  });

  it("keeps a fractional workload on salaried contracts", () => {
    const values = clearHiddenContractFormFields({
      contractType: "PERMANENT",
      grossSalary: 6000,
      workloadPercent: 53.2,
    });

    expect(values.workloadPercent).toBe(53.2);
  });

  it("drops the hourly rate on permanent contracts", () => {
    const values = clearHiddenContractFormFields({
      contractType: "PERMANENT",
      grossSalary: 6000,
      hourlyRate: 45,
    });

    expect(values.hourlyRate).toBeNull();
    expect(values.grossSalary).toBe(6000);
  });
});
