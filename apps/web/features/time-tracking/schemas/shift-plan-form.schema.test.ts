import { describe, expect, it } from "vitest";
import {
  createShiftPlanFormSchema,
  planDayCount,
} from "./shift-plan-form.schema";

const t = (k: string) => k;
const schema = createShiftPlanFormSchema(t);

describe("shift-plan-form.schema", () => {
  it("accepts a single day and a full quarter", () => {
    expect(
      schema.safeParse({
        startDate: new Date(2026, 0, 5),
        endDate: new Date(2026, 0, 5),
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 3, 2),
      }).success,
    ).toBe(true);
  });

  it("rejects end before start", () => {
    const res = schema.safeParse({
      startDate: new Date(2026, 0, 5),
      endDate: new Date(2026, 0, 4),
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe("shiftPlanEndBeforeStart");
    }
  });

  it("rejects more than 92 days", () => {
    const res = schema.safeParse({
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 3, 3),
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe("shiftPlanTooLong");
    }
  });

  it("counts days inclusively across DST", () => {
    expect(planDayCount(new Date(2026, 2, 28), new Date(2026, 2, 30))).toBe(3);
  });
});
