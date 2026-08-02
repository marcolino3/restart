import { describe, expect, it } from "vitest";
import { filterRecordsByWindow, getWindowCutoff } from "./filter-records-by-window";

describe("getWindowCutoff", () => {
  const today = new Date("2026-08-02T00:00:00Z");

  it("returns null for 'all'", () => {
    expect(getWindowCutoff("all", today)).toBeNull();
  });

  it("returns 90 days before today for 'last90'", () => {
    const cutoff = getWindowCutoff("last90", today);
    expect(cutoff?.toISOString().slice(0, 10)).toBe("2026-05-04");
  });

  it("returns 6 months before today for 'last6m'", () => {
    const cutoff = getWindowCutoff("last6m", today);
    expect(cutoff?.toISOString().slice(0, 10)).toBe("2026-02-02");
  });

  it("returns 12 months before today for 'last12m'", () => {
    const cutoff = getWindowCutoff("last12m", today);
    expect(cutoff?.toISOString().slice(0, 10)).toBe("2025-08-02");
  });

  it("resolves 'schoolYear' to Aug 1 of the current calendar year when today is on/after Aug 1", () => {
    const cutoff = getWindowCutoff("schoolYear", today);
    expect(cutoff?.toISOString().slice(0, 10)).toBe("2026-08-01");
  });

  it("resolves 'schoolYear' to the previous Aug 1 when today is before Aug 1", () => {
    const beforeAugust = new Date("2026-03-15T00:00:00Z");
    const cutoff = getWindowCutoff("schoolYear", beforeAugust);
    expect(cutoff?.toISOString().slice(0, 10)).toBe("2025-08-01");
  });
});

describe("filterRecordsByWindow", () => {
  const today = new Date("2026-08-02T00:00:00Z");
  const records = [
    { id: "r1", recordedAt: "2026-08-01" },
    { id: "r2", recordedAt: "2026-05-04" },
    { id: "r3", recordedAt: "2026-05-03" },
    { id: "r4", recordedAt: "2020-01-01" },
  ];

  it("returns all records unfiltered for 'all'", () => {
    const { filtered, cutoff } = filterRecordsByWindow(records, "all", today);
    expect(filtered).toHaveLength(4);
    expect(cutoff).toBeNull();
  });

  it("excludes records strictly before the cutoff for 'last90'", () => {
    const { filtered } = filterRecordsByWindow(records, "last90", today);
    expect(filtered.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("includes a record exactly on the cutoff date", () => {
    const { filtered } = filterRecordsByWindow(records, "last90", today);
    expect(filtered.some((r) => r.id === "r2")).toBe(true);
  });

  it("returns an empty array when nothing falls within the window", () => {
    const { filtered } = filterRecordsByWindow(
      [{ id: "old", recordedAt: "2000-01-01" }],
      "last90",
      today,
    );
    expect(filtered).toEqual([]);
  });
});
