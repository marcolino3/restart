import { describe, expect, it } from "vitest";

import { budgetTone, monthsLeft, perHead } from "./budget-kpis";

const schoolYear = { start: "2026-08-01", end: "2027-07-31" };

describe("budgetTone", () => {
  it("turns amber at 80% and rose at 95%", () => {
    expect(budgetTone(79)).toBe("green");
    expect(budgetTone(80)).toBe("amber");
    expect(budgetTone(94)).toBe("amber");
    expect(budgetTone(95)).toBe("rose");
    expect(budgetTone(140)).toBe("rose");
  });
});

describe("monthsLeft", () => {
  it("counts the running month up to the last month of the school year", () => {
    expect(monthsLeft(schoolYear, new Date(2026, 10, 12))).toBe(9);
    expect(monthsLeft(schoolYear, new Date(2026, 7, 1))).toBe(12);
    expect(monthsLeft(schoolYear, new Date(2027, 6, 31))).toBe(1);
  });

  it("has no answer outside the school year", () => {
    expect(monthsLeft(schoolYear, new Date(2026, 6, 31))).toBeNull();
    expect(monthsLeft(schoolYear, new Date(2027, 7, 1))).toBeNull();
  });
});

describe("perHead", () => {
  it("splits to the cent", () => {
    expect(perHead(4800, 18)).toBe(266.67);
  });

  it("does not divide by an empty class", () => {
    expect(perHead(100, 0)).toBeNull();
  });
});
