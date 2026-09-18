import { describe, expect, it } from "vitest";

import type { ClassBudgetSummary } from "../types";
import { combineSummaries } from "./combine-summaries";

const schoolYear = {
  start: "2026-08-01",
  end: "2027-07-31",
  startYear: 2026,
  label: "2026/27",
};
const material = { id: "c1", name: "Material", color: "#112233" };
const trips = { id: "c2", name: "Trips", color: null };

const summary = (
  overrides: Partial<ClassBudgetSummary>,
): ClassBudgetSummary => ({
  schoolClassId: "k1",
  schoolYear,
  budget: null,
  spent: 0,
  remaining: 0,
  isOverBudget: false,
  currency: "CHF",
  byCategory: [],
  ...overrides,
});

describe("combineSummaries", () => {
  it("returns null without summaries", () => {
    expect(combineSummaries([])).toBeNull();
  });

  it("sums budget, spending and categories across classes", () => {
    const result = combineSummaries([
      summary({
        budget: 500,
        spent: 120.1,
        byCategory: [{ category: material, total: 120.1 }],
      }),
      summary({
        schoolClassId: "k2",
        budget: 300,
        spent: 80.2,
        byCategory: [
          { category: material, total: 30.2 },
          { category: trips, total: 50 },
        ],
      }),
    ]);

    expect(result).toMatchObject({
      budget: 800,
      spent: 200.3,
      remaining: 599.7,
      isOverBudget: false,
    });
    expect(result?.byCategory).toEqual([
      { category: material, total: 150.3 },
      { category: trips, total: 50 },
    ]);
  });

  it("keeps the budget empty when no class has one", () => {
    const result = combineSummaries([summary({ spent: 10 })]);
    expect(result).toMatchObject({
      budget: null,
      spent: 10,
      isOverBudget: false,
    });
  });

  it("flags an overrun of the total", () => {
    const result = combineSummaries([
      summary({ budget: 100, spent: 150 }),
      summary({ schoolClassId: "k2", spent: 10 }),
    ]);
    expect(result).toMatchObject({ remaining: -60, isOverBudget: true });
  });
});
