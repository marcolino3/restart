import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatProgressEntryDate } from "./format-progress-entry-date";

const TIME_ZONE = "Europe/Zurich";
const TODAY_LABEL = "Heute";
const YESTERDAY_LABEL = "Gestern";

describe("formatProgressEntryDate", () => {
  beforeEach(() => {
    // Freeze "now" so the today/yesterday relative labels are deterministic.
    // 2026-05-20 12:00 UTC is 2026-05-20 14:00 in Europe/Zurich (CEST).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-20T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels a same-day entry as today, with the school-local time", () => {
    const result = formatProgressEntryDate(
      "2026-05-20T09:15:00.000Z",
      "de",
      TODAY_LABEL,
      YESTERDAY_LABEL,
      TIME_ZONE,
    );
    expect(result).toBe("Heute, 11:15");
  });

  it("labels the previous school-local day as yesterday", () => {
    const result = formatProgressEntryDate(
      "2026-05-19T20:00:00.000Z",
      "de",
      TODAY_LABEL,
      YESTERDAY_LABEL,
      TIME_ZONE,
    );
    expect(result).toBe("Gestern");
  });

  it("spells out the weekday for older entries instead of abbreviating it", () => {
    const result = formatProgressEntryDate(
      "2026-05-18T09:15:00.000Z",
      "de",
      TODAY_LABEL,
      YESTERDAY_LABEL,
      TIME_ZONE,
    );
    expect(result).toBe("Montag, 18. Mai");
    expect(result).not.toContain("Mo,");
  });

  it("resolves the calendar day in the school's timezone, not the runtime's", () => {
    // 2026-05-20 22:30 UTC is already 2026-05-21 00:30 in Zurich (CEST,
    // UTC+2) -- one day after the frozen "today", so it must NOT be
    // reported as today even though the server runtime is UTC.
    const result = formatProgressEntryDate(
      "2026-05-20T22:30:00.000Z",
      "de",
      TODAY_LABEL,
      YESTERDAY_LABEL,
      TIME_ZONE,
    );
    expect(result).not.toContain(TODAY_LABEL);
  });

  it("falls back to the raw ISO string when the timestamp is unparsable", () => {
    const result = formatProgressEntryDate(
      "not-a-date",
      "de",
      TODAY_LABEL,
      YESTERDAY_LABEL,
      TIME_ZONE,
    );
    expect(result).toBe("not-a-date");
  });
});
