import { describe, expect, it } from "vitest";

import { mapEmployeeFunctionsToOptions } from "./map-employee-functions-to-options";
import type { EmployeeFunctionItem } from "../types";

const sample: EmployeeFunctionItem = {
  id: "fn-1",
  name: "Lehrperson",
  sortOrder: 0,
  isActive: true,
  isArchived: false,
  usageCount: 0,
  translations: [
    { locale: "DE", name: "Lehrperson" },
    { locale: "EN", name: "Teacher" },
  ],
};

describe("mapEmployeeFunctionsToOptions", () => {
  it("maps function ids to localized labels", () => {
    expect(mapEmployeeFunctionsToOptions([sample], "en")).toEqual([
      { value: "fn-1", label: "Teacher" },
    ]);
  });

  it("preserves the backend sort order", () => {
    const second: EmployeeFunctionItem = {
      ...sample,
      id: "fn-2",
      name: "Sekretariat",
      sortOrder: 1,
      translations: [{ locale: "DE", name: "Sekretariat" }],
    };

    expect(mapEmployeeFunctionsToOptions([sample, second], "de")).toEqual([
      { value: "fn-1", label: "Lehrperson" },
      { value: "fn-2", label: "Sekretariat" },
    ]);
  });
});
