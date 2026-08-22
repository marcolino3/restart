import { describe, expect, it } from "vitest";
import { buildRoleOptions, type RoleTranslator } from "./role-options";

/** Stub translator that only knows the keys it was seeded with. */
const makeTranslator = (messages: Record<string, string>): RoleTranslator => {
  const t = ((key: string) => messages[key] ?? key) as RoleTranslator;
  t.has = (key: string) => key in messages;
  return t;
};

describe("buildRoleOptions", () => {
  it("translates system roles by their code", () => {
    const t = makeTranslator({
      roleName_TEACHER: "Teacher",
      roleDesc_TEACHER: "Teaches classes",
    });

    expect(
      buildRoleOptions(
        [{ id: "role-1", name: "TEACHER", systemCode: "TEACHER" }],
        t,
      ),
    ).toEqual([
      { value: "role-1", label: "Teacher", description: "Teaches classes" },
    ]);
  });

  it("keeps a custom role's own name and leaves it undescribed", () => {
    const t = makeTranslator({});

    expect(
      buildRoleOptions([{ id: "role-2", name: "Mentor", systemCode: null }], t),
    ).toEqual([
      { value: "role-2", label: "Mentor", description: undefined },
    ]);
  });

  it("falls back to the code, then the id, when no name is set", () => {
    const t = makeTranslator({});

    expect(
      buildRoleOptions(
        [
          { id: "role-3", name: null, systemCode: "HR" },
          { id: "role-4", name: null, systemCode: null },
        ],
        t,
      ).map((o) => o.label),
    ).toEqual(["HR", "role-4"]);
  });

  it("returns an empty list for an org without roles", () => {
    expect(buildRoleOptions([], makeTranslator({}))).toEqual([]);
  });
});
