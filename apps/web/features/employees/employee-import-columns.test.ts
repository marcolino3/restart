import { describe, expect, it } from "vitest";

import {
  buildEmployeeImportTemplate,
  EMPLOYEE_IMPORT_COLUMNS,
  EMPLOYEE_IMPORT_GROUPS,
} from "./employee-import-columns";

describe("employee import column catalog", () => {
  it("has unique keys, email as the only required column and every group used", () => {
    const keys = EMPLOYEE_IMPORT_COLUMNS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(EMPLOYEE_IMPORT_COLUMNS.filter((c) => c.required)).toEqual([
      expect.objectContaining({ key: "email" }),
    ]);
    for (const group of EMPLOYEE_IMPORT_GROUPS) {
      expect(EMPLOYEE_IMPORT_COLUMNS.some((c) => c.group === group)).toBe(true);
    }
  });

  it("builds a semicolon template with a header and one example row", () => {
    const lines = buildEmployeeImportTemplate().trimEnd().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0].split(";")).toEqual(EMPLOYEE_IMPORT_COLUMNS.map((c) => c.key));
    expect(lines[1].split(";")).toHaveLength(EMPLOYEE_IMPORT_COLUMNS.length);
    expect(lines[1]).toContain("max@example.com");
  });
});
