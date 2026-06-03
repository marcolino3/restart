import { describe, it, expect } from "vitest";

import {
  DEFAULT_CARD_FIELDS,
  DEFAULT_TABLE_COLUMNS,
  resolveCardFields,
  resolveTableColumns,
} from "./field-registry";

describe("resolveCardFields", () => {
  it("falls back to defaults for null / empty", () => {
    expect(resolveCardFields(null)).toEqual(DEFAULT_CARD_FIELDS);
    expect(resolveCardFields(undefined)).toEqual(DEFAULT_CARD_FIELDS);
    expect(resolveCardFields([])).toEqual(DEFAULT_CARD_FIELDS);
  });

  it("keeps only known keys and drops unknown ones", () => {
    expect(resolveCardFields(["birthYear", "bogus", "gender"])).toEqual([
      "birthYear",
      "gender",
    ]);
  });

  it("drops duplicates while preserving the stored order", () => {
    expect(resolveCardFields(["gender", "birthYear", "gender"])).toEqual([
      "gender",
      "birthYear",
    ]);
  });

  it("falls back to defaults when no known key survives", () => {
    expect(resolveCardFields(["bogus", "nope"])).toEqual(DEFAULT_CARD_FIELDS);
  });
});

describe("resolveTableColumns", () => {
  it("falls back to defaults for null / empty", () => {
    expect(resolveTableColumns(null)).toEqual(DEFAULT_TABLE_COLUMNS);
    expect(resolveTableColumns([])).toEqual(DEFAULT_TABLE_COLUMNS);
  });

  it("keeps only known columns", () => {
    expect(resolveTableColumns(["family", "bogus", "days"])).toEqual([
      "family",
      "days",
    ]);
  });
});
