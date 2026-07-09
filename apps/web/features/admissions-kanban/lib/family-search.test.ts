import { describe, it, expect } from "vitest";
import { filterFamilies, type FamilySearchItem } from "./family-search";

const families: FamilySearchItem[] = [
  { id: "f1", name: "Müller", contactNames: ["Anna Müller", "Beat Müller"] },
  { id: "f2", name: "Schmid", contactNames: ["Clara Schmid"] },
  // A family with NO existing application — only reachable via the new
  // `existingFamilies` source (the families query), not derivable from the
  // loaded applications. This is the Fix 1 regression case.
  { id: "f3", name: "Weber", contactNames: ["Dora Weber"] },
];

describe("filterFamilies", () => {
  it("returns the first `limit` families for an empty query", () => {
    const res = filterFamilies(families, "");
    expect(res.map((f) => f.id)).toEqual(["f1", "f2", "f3"]);
  });

  it("caps results at the given limit", () => {
    const res = filterFamilies(families, "", 2);
    expect(res).toHaveLength(2);
    expect(res.map((f) => f.id)).toEqual(["f1", "f2"]);
  });

  it("matches by family name (case-insensitive)", () => {
    const res = filterFamilies(families, "schmid");
    expect(res.map((f) => f.id)).toEqual(["f2"]);
  });

  it("matches by contact name", () => {
    const res = filterFamilies(families, "beat");
    expect(res.map((f) => f.id)).toEqual(["f1"]);
  });

  it("finds a family that has NO existing application (regression: Fix 1)", () => {
    // 'Weber'/'Dora Weber' exists only in the families list, never in the
    // applications-derived data — the old bug made it unfindable.
    const byName = filterFamilies(families, "Weber");
    expect(byName.map((f) => f.id)).toEqual(["f3"]);

    const byContact = filterFamilies(families, "dora");
    expect(byContact.map((f) => f.id)).toEqual(["f3"]);
  });

  it("de-duplicates families by id before filtering", () => {
    const dupes: FamilySearchItem[] = [
      ...families,
      { id: "f1", name: "Müller", contactNames: ["Anna Müller"] },
    ];
    const res = filterFamilies(dupes, "");
    expect(res.map((f) => f.id)).toEqual(["f1", "f2", "f3"]);
  });

  it("returns nothing when the query matches no family", () => {
    expect(filterFamilies(families, "zzz")).toEqual([]);
  });
});
