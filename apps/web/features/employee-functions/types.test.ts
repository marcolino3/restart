import { describe, expect, it } from "vitest";

import {
  pickEmployeeFunctionName,
  resolveEmployeeFunctionPosition,
  type EmployeeFunctionItem,
} from "./types";

const sample: EmployeeFunctionItem = {
  id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  name: "Lehrperson",
  sortOrder: 0,
  isActive: true,
  isArchived: false,
  usageCount: 0,
  translations: [
    { locale: "DE", name: "Lehrperson" },
    { locale: "FR", name: "Enseignant·e" },
    { locale: "IT", name: "Docente" },
    { locale: "EN", name: "Teacher" },
  ],
};

describe("pickEmployeeFunctionName", () => {
  it("prefers the requested locale", () => {
    expect(pickEmployeeFunctionName(sample, "fr")).toBe("Enseignant·e");
  });

  it("falls back to DE when locale is missing", () => {
    const item = {
      ...sample,
      translations: [{ locale: "DE" as const, name: "Lehrperson" }],
    };
    expect(pickEmployeeFunctionName(item, "en")).toBe("Lehrperson");
  });
});

describe("resolveEmployeeFunctionPosition", () => {
  it("resolves a stored function id", () => {
    expect(
      resolveEmployeeFunctionPosition(
        "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        [sample],
        "en",
      ),
    ).toBe("Teacher");
  });

  it("keeps legacy free-text values", () => {
    expect(
      resolveEmployeeFunctionPosition("Custom role", [sample], "de"),
    ).toBe("Custom role");
  });
});
