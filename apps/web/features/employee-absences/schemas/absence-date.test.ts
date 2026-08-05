import { describe, expect, it } from "vitest";
import {
  formatAbsenceDateTime,
  parseAbsenceDateTime,
  toAbsenceIsoDateTime,
} from "@restart/shared-schemas/employee-absences/absence-date";

describe("parseAbsenceDateTime", () => {
  it("parses ISO strings from server actions", () => {
    const date = parseAbsenceDateTime("2026-08-05T10:30:00.000Z");
    expect(date).toBeInstanceOf(Date);
    expect(date?.toISOString()).toBe("2026-08-05T10:30:00.000Z");
  });

  it("parses legacy date-only values", () => {
    const date = parseAbsenceDateTime("2026-08-05");
    expect(date).toBeInstanceOf(Date);
    expect(date?.getHours()).toBe(0);
  });

  it("parses GraphQL String-serialized epoch milliseconds", () => {
    const date = parseAbsenceDateTime("1785880800000");
    expect(date).toBeInstanceOf(Date);
    expect(date?.toISOString()).toBe("2026-08-04T22:00:00.000Z");
  });

  it("returns null for invalid values", () => {
    expect(parseAbsenceDateTime("not-a-date")).toBeNull();
  });
});

describe("toAbsenceIsoDateTime", () => {
  it("serializes date-only as YYYY-MM-DD without UTC day shift", () => {
    const local = new Date(2026, 3, 1, 0, 0, 0, 0); // 1 April local
    expect(toAbsenceIsoDateTime(local, false)).toBe("2026-04-01");
  });

  it("serializes with time as full ISO", () => {
    const date = new Date("2026-04-01T10:30:00.000Z");
    expect(toAbsenceIsoDateTime(date, true)).toBe("2026-04-01T10:30:00.000Z");
  });
});

describe("formatAbsenceDateTime", () => {
  it("formats GraphQL epoch millisecond strings", () => {
    expect(formatAbsenceDateTime("1785880800000", "de")).toMatch(/2026/);
  });
});
