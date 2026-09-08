import { describe, expect, it } from "vitest";
import {
  datesBetween,
  isoWeekOf,
  weekdayLabel,
  weekdayOf,
} from "./shift-plan-dates";

describe("shift-plan-dates", () => {
  it("maps ISO dates to weekday keys", () => {
    expect(weekdayOf("2026-09-07")).toBe("mon");
    expect(weekdayOf("2026-09-13")).toBe("sun");
  });

  it("lists dates inclusively", () => {
    expect(datesBetween("2026-01-30", "2026-02-02")).toEqual([
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
  });

  it("computes ISO week numbers across year boundaries", () => {
    expect(isoWeekOf("2026-01-01")).toBe(1);
    expect(isoWeekOf("2027-01-01")).toBe(53);
    expect(isoWeekOf("2026-09-07")).toBe(37);
  });

  it("localises weekday labels", () => {
    expect(weekdayLabel("mon", "de")).toMatch(/^Mo/);
    expect(weekdayLabel("mon", "en")).toBe("Mon");
  });
});
