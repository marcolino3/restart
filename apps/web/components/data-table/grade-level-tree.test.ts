import { describe, expect, it } from "vitest";

import { normalizeForSearch } from "@/lib/table/locale-sorting";

import type { FilterOption } from "./DataTableFilter";

/**
 * Mirrors the hierarchy-aware search inside `DataTableFilter`: a nested option
 * survives when its own label matches, or when its nearest parent did.
 */
function filterOptions(
  options: FilterOption[],
  search: string,
): FilterOption[] {
  if (!search) return options;

  const needle = normalizeForSearch(search);
  const kept: FilterOption[] = [];
  const matchedAtDepth = new Map<number, boolean>();

  for (const option of options) {
    const depth = option.depth ?? 0;
    const selfMatches = normalizeForSearch(option.label).includes(needle);
    const parentMatched = depth > 0 && matchedAtDepth.get(depth - 1);

    matchedAtDepth.set(depth, selfMatches || Boolean(parentMatched));

    if (selfMatches || parentMatched) kept.push(option);
  }

  return kept;
}

const OPTIONS: FilterOption[] = [
  { value: "Primarstufe", label: "Primarstufe", depth: 0 },
  { value: "1. Klasse", label: "1. Klasse", depth: 1 },
  { value: "2. Klasse", label: "2. Klasse", depth: 1 },
  { value: "Oberstufe", label: "Oberstufe", depth: 0 },
  { value: "Sekundarklasse", label: "Sekundarklasse", depth: 1 },
];

describe("grade level filter hierarchy", () => {
  it("keeps every option when there is no search", () => {
    expect(filterOptions(OPTIONS, "")).toHaveLength(5);
  });

  it("keeps a matching parent's children so they are not orphaned", () => {
    const result = filterOptions(OPTIONS, "Primarstufe").map((o) => o.label);

    expect(result).toEqual(["Primarstufe", "1. Klasse", "2. Klasse"]);
  });

  it("keeps a directly matching child even when its parent does not match", () => {
    const result = filterOptions(OPTIONS, "Sekundar").map((o) => o.label);

    expect(result).toEqual(["Sekundarklasse"]);
  });

  it("does not leak children of a non-matching sibling branch", () => {
    const result = filterOptions(OPTIONS, "Oberstufe").map((o) => o.label);

    expect(result).toEqual(["Oberstufe", "Sekundarklasse"]);
    expect(result).not.toContain("1. Klasse");
  });

  it("matches diacritics-insensitively", () => {
    const options: FilterOption[] = [
      { value: "Förderstufe", label: "Förderstufe", depth: 0 },
    ];

    expect(filterOptions(options, "forderstufe")).toHaveLength(1);
  });
});
