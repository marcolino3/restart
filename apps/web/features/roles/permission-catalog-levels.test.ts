import { describe, it, expect } from "vitest";

import {
  PERMISSION_CATALOG,
  CATEGORY_ORDER,
  codesForLevel,
  detectLevel,
  categoryLevelCounts,
  type PermissionLevel,
} from "@restart/shared-schemas/rbac/permission-catalog";

const ALL_CODES = new Set(PERMISSION_CATALOG.map((e) => e.code));
const LEVELS: PermissionLevel[] = [0, 1, 2, 3];

describe("permission level model", () => {
  it("assigns a level to every non-hidden entry", () => {
    const missing = PERMISSION_CATALOG.filter((e) => !e.hidden && e.level === undefined);
    expect(missing.map((e) => e.code)).toEqual([]);
  });

  it("never assigns a level to a hidden entry", () => {
    const withLevel = PERMISSION_CATALOG.filter((e) => e.hidden && e.level !== undefined);
    expect(withLevel.map((e) => e.code)).toEqual([]);
  });
});

describe("codesForLevel", () => {
  it("returns nothing at level 0", () => {
    for (const category of CATEGORY_ORDER) {
      expect(codesForLevel(category, 0, ALL_CODES)).toEqual([]);
    }
  });

  it("is monotonically increasing per category", () => {
    for (const category of CATEGORY_ORDER) {
      const l1 = new Set(codesForLevel(category, 1, ALL_CODES));
      const l2 = new Set(codesForLevel(category, 2, ALL_CODES));
      const l3 = new Set(codesForLevel(category, 3, ALL_CODES));
      for (const code of l1) expect(l2.has(code)).toBe(true);
      for (const code of l2) expect(l3.has(code)).toBe(true);
    }
  });

  it("only returns codes available to the org", () => {
    const limited = new Set(["EMPLOYEE_READ"]);
    expect(codesForLevel("employees", 1, limited)).toEqual(["EMPLOYEE_READ"]);
    expect(codesForLevel("employees", 3, limited)).toEqual(["EMPLOYEE_READ"]);
  });
});

describe("detectLevel", () => {
  it("detects every level exactly via roundtrip with codesForLevel", () => {
    for (const category of CATEGORY_ORDER) {
      let previous: string[] = [];
      for (const level of LEVELS) {
        const codes = codesForLevel(category, level, ALL_CODES);
        // A level that adds no new codes over the previous one is indistinguishable
        // from it (e.g. a category with no level-1 entries) - detectLevel correctly
        // reports the lowest matching level, so only assert the roundtrip where the
        // level actually changes the granted set.
        if (codes.length === previous.length) {
          previous = codes;
          continue;
        }
        expect(detectLevel(category, new Set(codes), ALL_CODES)).toBe(level);
        previous = codes;
      }
    }
  });

  it("returns null (Individuell) for a non-matching combination", () => {
    const entries = PERMISSION_CATALOG.filter(
      (e) => e.category === "employees" && !e.hidden && e.level !== undefined,
    );
    // Skip categories that don't have at least two distinct levels to mix.
    const levels = new Set(entries.map((e) => e.level));
    if (levels.size < 2) return;

    const sortedByLevel = [...entries].sort((a, b) => (a.level! - b.level!));
    const oddOneOut = new Set([sortedByLevel[sortedByLevel.length - 1]!.code]);
    expect(detectLevel("employees", oddOneOut, ALL_CODES)).toBeNull();
  });

  it("treats an empty granted set as level 0", () => {
    for (const category of CATEGORY_ORDER) {
      expect(detectLevel(category, new Set(), ALL_CODES)).toBe(0);
    }
  });
});

describe("categoryLevelCounts", () => {
  it("sums to the number of leveled entries in the category", () => {
    for (const category of CATEGORY_ORDER) {
      const counts = categoryLevelCounts(category, ALL_CODES);
      const total = counts[1] + counts[2] + counts[3];
      const expected = PERMISSION_CATALOG.filter(
        (e) => e.category === category && !e.hidden && e.level !== undefined,
      ).length;
      expect(total).toBe(expected);
    }
  });
});
