import { describe, it, expect } from "vitest";
import { GradeLevelFormSchema } from "./grade-level-form.schema";

describe("GradeLevelFormSchema", () => {
  const PARENT_ID = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts a top-level Stufe without a parent", () => {
    const result = GradeLevelFormSchema.safeParse({ name: "Unterstufe" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });

  it("normalizes an empty parentId to null (top-level)", () => {
    const result = GradeLevelFormSchema.safeParse({
      name: "Unterstufe",
      parentId: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });

  it("accepts a subgroup with a valid parent uuid", () => {
    const result = GradeLevelFormSchema.safeParse({
      name: "Gruppe A",
      parentId: PARENT_ID,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBe(PARENT_ID);
  });

  it("rejects a non-uuid parentId", () => {
    const result = GradeLevelFormSchema.safeParse({
      name: "Gruppe A",
      parentId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("still enforces the age range with the new field present", () => {
    const result = GradeLevelFormSchema.safeParse({
      name: "Unterstufe",
      parentId: PARENT_ID,
      ageMin: 9,
      ageMax: 6,
    });
    expect(result.success).toBe(false);
  });
});
