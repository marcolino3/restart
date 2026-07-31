import type { Row } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

import {
  createLocaleSortingFn,
  localeIncludesFilter,
  multiSelectFilter,
  normalizeForSearch,
} from "./locale-sorting";

interface Person {
  name: string;
}

/** Minimal `Row` stub — the sorting/filter fns only ever call `getValue`. */
function row(value: unknown): Row<Person> {
  return { getValue: () => value } as unknown as Row<Person>;
}

function sortNames(names: string[], locale = "de-CH"): string[] {
  const sortingFn = createLocaleSortingFn<Person>(locale);
  return [...names].sort((a, b) => sortingFn(row(a), row(b), "name"));
}

describe("createLocaleSortingFn", () => {
  // Regression: the default `<`/`>` comparison comparesUTF-16 code points,
  // which puts every umlaut after `z`.
  it("sorts German umlauts next to their base letter, not after z", () => {
    expect(sortNames(["Zürcher", "Öztürk", "Ärztin", "Zahn"])).toEqual([
      "Ärztin",
      "Öztürk",
      "Zahn",
      "Zürcher",
    ]);
  });

  it("beats a naive code-point sort on the same input", () => {
    const input = ["Zürcher", "Öztürk", "Ärztin", "Zahn"];
    const naive = [...input].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));

    // Documents the bug: naive sorting strands the umlaut names at the end.
    expect(naive).toEqual(["Zahn", "Zürcher", "Ärztin", "Öztürk"]);
    expect(sortNames(input)).not.toEqual(naive);
  });

  it("sorts numbers inside strings naturally", () => {
    expect(sortNames(["Klasse 10", "Klasse 2", "Klasse 1"])).toEqual([
      "Klasse 1",
      "Klasse 2",
      "Klasse 10",
    ]);
  });

  it("ignores case when ordering", () => {
    expect(sortNames(["beta", "Alpha", "gamma"])).toEqual([
      "Alpha",
      "beta",
      "gamma",
    ]);
  });

  it("always sorts empty values last", () => {
    const sortingFn = createLocaleSortingFn<Person>("de-CH");

    expect(sortingFn(row(""), row("Anna"), "name")).toBe(1);
    expect(sortingFn(row("Anna"), row(""), "name")).toBe(-1);
    expect(sortingFn(row(null), row(undefined), "name")).toBe(0);
  });

  it("orders dates chronologically", () => {
    const sortingFn = createLocaleSortingFn<Person>("de-CH");
    const earlier = new Date("2026-01-01");
    const later = new Date("2026-07-31");

    expect(sortingFn(row(earlier), row(later), "name")).toBeLessThan(0);
  });
});

describe("normalizeForSearch", () => {
  it("strips diacritics and lowercases", () => {
    expect(normalizeForSearch("Müller")).toBe("muller");
    expect(normalizeForSearch("Öztürk")).toBe("ozturk");
    expect(normalizeForSearch("  Ärztin ")).toBe("arztin");
  });

  it("handles nullish values", () => {
    expect(normalizeForSearch(null)).toBe("");
    expect(normalizeForSearch(undefined)).toBe("");
  });
});

describe("localeIncludesFilter", () => {
  it("matches across diacritics in both directions", () => {
    expect(localeIncludesFilter(row("Müller"), "name", "muller")).toBe(true);
    expect(localeIncludesFilter(row("Muller"), "name", "müller")).toBe(true);
  });

  it("matches case-insensitively on substrings", () => {
    expect(localeIncludesFilter(row("Anna Meier"), "name", "MEIER")).toBe(true);
  });

  it("passes everything through for an empty filter", () => {
    expect(localeIncludesFilter(row("Anna"), "name", "")).toBe(true);
    expect(localeIncludesFilter(row("Anna"), "name", undefined)).toBe(true);
  });

  it("rejects non-matches", () => {
    expect(localeIncludesFilter(row("Anna"), "name", "zzz")).toBe(false);
  });
});

describe("multiSelectFilter", () => {
  it("keeps rows whose value is selected", () => {
    expect(multiSelectFilter(row("ACTIVE"), "status", ["ACTIVE"])).toBe(true);
    expect(multiSelectFilter(row("ACTIVE"), "status", ["ARCHIVED"])).toBe(false);
  });

  it("treats an empty selection as no filter", () => {
    expect(multiSelectFilter(row("ACTIVE"), "status", [])).toBe(true);
    expect(multiSelectFilter(row("ACTIVE"), "status", undefined)).toBe(true);
  });
});
