import { describe, it, expect } from "vitest";

import { roleDisplayName } from "./role-display-name";

type Translator = Parameters<typeof roleDisplayName>[0];

/**
 * Minimal stand-in for the next-intl translator: resolves the keys passed in
 * and reports every other key as missing via `has`.
 */
function makeTranslator(messages: Record<string, string>): Translator {
  const t = ((key: string) => messages[key] ?? key) as unknown as Translator;
  (t as unknown as { has: (key: string) => boolean }).has = (key: string) =>
    key in messages;
  return t;
}

describe("roleDisplayName", () => {
  it("prefers the translated system role name over the stored name", () => {
    const t = makeTranslator({ "systemRoleName.EMPLOYEE": "Mitarbeitende" });

    expect(
      roleDisplayName(t, { name: "Employee", systemCode: "EMPLOYEE" }),
    ).toBe("Mitarbeitende");
  });

  it("falls back to the stored name when the system code has no translation", () => {
    const t = makeTranslator({});

    expect(
      roleDisplayName(t, { name: "Legacy Role", systemCode: "LEGACY_CODE" }),
    ).toBe("Legacy Role");
  });

  it("uses the stored name for custom roles without a system code", () => {
    const t = makeTranslator({ "systemRoleName.EMPLOYEE": "Mitarbeitende" });

    expect(roleDisplayName(t, { name: "Praktikum", systemCode: null })).toBe(
      "Praktikum",
    );
  });

  it("returns an empty string when neither a translation nor a name exists", () => {
    const t = makeTranslator({});

    expect(roleDisplayName(t, { name: null, systemCode: null })).toBe("");
  });

  it("still resolves the translation when the stored name is null", () => {
    const t = makeTranslator({ "systemRoleName.OWNER": "Inhaber" });

    expect(roleDisplayName(t, { name: null, systemCode: "OWNER" })).toBe(
      "Inhaber",
    );
  });
});
