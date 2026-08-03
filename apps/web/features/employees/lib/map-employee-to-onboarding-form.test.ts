import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Persona } from "@restart/shared-types/graphql";
import type { EmployeeContract } from "../actions/employee-contracts.actions";
import type { EmployeeDetail } from "../actions/get-employee-by-id.action";
import type { EmployeeFunctionItem } from "@/features/employee-functions/types";
import { mapEmployeeToOnboardingForm } from "./map-employee-to-onboarding-form";

const FUNCTION_ID = "11111111-1111-4111-8111-111111111111";

const employeeFunctions: EmployeeFunctionItem[] = [
  {
    id: FUNCTION_ID,
    name: "Lehrperson",
    sortOrder: 0,
    isActive: true,
    isArchived: false,
    usageCount: 1,
    translations: [{ locale: "DE", name: "Lehrperson" }],
  },
];

function makeEmployee(
  overrides: Partial<EmployeeDetail> = {},
): EmployeeDetail {
  return {
    id: "emp-1",
    status: "ACTIVE",
    timeTrackingEnabled: true,
    membership: {
      id: "mem-1",
      persona: Persona.Employee,
      language: "de",
      roles: [{ id: "role-1", name: "Teacher" }],
      user: {
        id: "user-1",
        firstName: "Ada",
        lastName: "Lovelace",
        userEmails: [
          { email: "other@school.ch", isPrimary: false },
          { email: "ada@school.ch", isPrimary: true },
        ],
      },
    },
    ...overrides,
  } as EmployeeDetail;
}

function makeContract(
  overrides: Partial<EmployeeContract> & Pick<EmployeeContract, "id" | "startDate">,
): EmployeeContract {
  return {
    employeeId: "emp-1",
    isActive: true,
    contractType: "PERMANENT",
    position: FUNCTION_ID,
    workloadPercent: 80,
    weeklyHours: "42",
    grossSalary: 8000,
    has13thSalary: false,
    ...overrides,
  };
}

describe("mapEmployeeToOnboardingForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prefers the contract valid today over expired and future rows", () => {
    const form = mapEmployeeToOnboardingForm({
      employee: makeEmployee(),
      contracts: [
        makeContract({
          id: "c-future",
          startDate: "2027-01-01",
          workloadPercent: 100,
        }),
        makeContract({
          id: "c-current",
          startDate: "2026-01-01",
          endDate: null,
          workloadPercent: 60,
          probationEndDate: "2026-04-01",
        }),
        makeContract({
          id: "c-expired",
          startDate: "2024-01-01",
          endDate: "2025-12-31",
          workloadPercent: 40,
        }),
      ],
      locale: "de",
      employeeFunctions,
    });

    expect(form.workloadPercent).toBe(60);
    expect(form.probationEndDate).toEqual(new Date("2026-04-01"));
    expect(form.position).toBe(FUNCTION_ID);
    expect(form.email).toBe("ada@school.ch");
  });

  it("falls back to the soonest future contract when none has started", () => {
    const form = mapEmployeeToOnboardingForm({
      employee: makeEmployee(),
      contracts: [
        makeContract({
          id: "c-later",
          startDate: "2027-09-01",
          workloadPercent: 100,
        }),
        makeContract({
          id: "c-soon",
          startDate: "2026-09-01",
          workloadPercent: 50,
        }),
      ],
      locale: "de",
    });

    expect(form.workloadPercent).toBe(50);
    expect(form.startDate).toEqual(new Date("2026-09-01"));
  });

  it("resolves a legacy position name to the matching function id", () => {
    const form = mapEmployeeToOnboardingForm({
      employee: makeEmployee(),
      contracts: [
        makeContract({
          id: "c1",
          startDate: "2026-01-01",
          position: "Lehrperson",
        }),
      ],
      locale: "de",
      employeeFunctions,
    });

    expect(form.position).toBe(FUNCTION_ID);
  });

  it("maps exact-time windows and ignores empty weekday slots", () => {
    const form = mapEmployeeToOnboardingForm({
      employee: makeEmployee(),
      contracts: [
        makeContract({
          id: "c1",
          startDate: "2026-01-01",
          weekdayTimeWindows: {
            mon: [{ start: "08:00", end: "12:00" }],
            tue: [],
          },
        }),
      ],
      locale: "de",
    });

    expect(form.weekdayTimeWindows).toEqual({
      mon: [{ start: "08:00", end: "12:00" }],
    });
  });
});
