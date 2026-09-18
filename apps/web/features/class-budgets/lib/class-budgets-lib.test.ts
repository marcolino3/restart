import { describe, expect, it } from "vitest";

import type { BudgetSchoolYear } from "../types";
import { formatMoney, spentPercent } from "./format-money";
import { userHasPermission } from "./permissions";
import { RECEIPT_MAX_BYTES, receiptUrl, rejectReceipt } from "./receipts";
import {
  budgetPlanningYears,
  defaultExpenseDateFor,
  pickSchoolYear,
} from "./school-year";

const year = (startYear: number): BudgetSchoolYear => ({
  start: `${startYear}-08-01`,
  end: `${startYear + 1}-07-31`,
  startYear,
  label: `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`,
});

// Newest first, as the backend returns them.
const years = [year(2027), year(2026), year(2025)];
const now = new Date(2026, 8, 18); // 18 Sep 2026 → school year 2026/27

describe("school year helpers", () => {
  it("defaults to the running year, not the newest budgeted one", () => {
    expect(pickSchoolYear(years, undefined, now)?.startYear).toBe(2026);
  });

  it("honours a selectable year from the URL and ignores unknown ones", () => {
    expect(pickSchoolYear(years, "2025", now)?.startYear).toBe(2025);
    expect(pickSchoolYear(years, "1999", now)?.startYear).toBe(2026);
    expect(pickSchoolYear([], "2026", now)).toBeUndefined();
  });

  it("keeps a new expense inside the selected year", () => {
    expect(defaultExpenseDateFor(year(2026), now)).toBe("2026-09-18");
    expect(defaultExpenseDateFor(year(2025), now)).toBe("2026-07-31");
    expect(defaultExpenseDateFor(year(2027), now)).toBe("2027-08-01");
  });

  it("offers the next year for planning exactly once", () => {
    const options = budgetPlanningYears([year(2026), year(2025)], now);
    expect(options.map((o) => o.startYear)).toEqual([2027, 2026, 2025]);
    expect(options[0].label).toBe("2027/28");
    expect(budgetPlanningYears(years, now)).toHaveLength(3);
  });
});

describe("money helpers", () => {
  it("formats in the Swiss style of the locale", () => {
    // The grouping apostrophe differs between ICU versions (' vs ’).
    expect(formatMoney(1500.5, "CHF", "de")).toMatch(/1['’]500\.50/);
    expect(formatMoney(1500.5, "CHF", "en")).toContain("CHF");
  });

  it("has no percentage without a positive budget", () => {
    expect(spentPercent(50, null)).toBeNull();
    expect(spentPercent(50, 0)).toBeNull();
    expect(spentPercent(50, 200)).toBe(25);
    expect(spentPercent(300, 200)).toBe(150);
  });
});

describe("receipt helpers", () => {
  it("pre-checks type and size like the backend", () => {
    expect(rejectReceipt({ type: "application/pdf", size: 1024 })).toBeNull();
    expect(rejectReceipt({ type: "image/gif", size: 1024 })).toBe("type");
    expect(
      rejectReceipt({ type: "image/png", size: RECEIPT_MAX_BYTES + 1 }),
    ).toBe("size");
  });

  it("always addresses a receipt together with its class", () => {
    expect(receiptUrl("class-1", "file.pdf")).toBe(
      "/api/expense-receipts/file.pdf?schoolClassId=class-1",
    );
  });
});

describe("userHasPermission", () => {
  it("lets a SuperAdmin pass without the code, like the client hook", () => {
    expect(
      userHasPermission({ isSuperAdmin: true, permissions: [] }, "X"),
    ).toBe(true);
  });

  it("requires the code for everyone else", () => {
    expect(userHasPermission({ permissions: ["X"] }, "X")).toBe(true);
    expect(userHasPermission({ permissions: ["Y"] }, "X")).toBe(false);
    expect(userHasPermission(undefined, "X")).toBe(false);
  });
});
