import { describe, it, expect } from "vitest";

import { NAV_PREVIEW_ENTRIES, isNavEntryVisible } from "./nav-visibility";
import { PERMISSION_CATALOG } from "../permission-catalog";

describe("isNavEntryVisible", () => {
  it("always shows entries without a gating permission", () => {
    expect(isNavEntryVisible(undefined, new Set())).toBe(true);
  });

  it("hides a gated entry when the role lacks the permission", () => {
    expect(isNavEntryVisible("ROLE_ASSIGN", new Set())).toBe(false);
  });

  it("shows a gated entry when the role holds the permission", () => {
    expect(isNavEntryVisible("ROLE_ASSIGN", new Set(["ROLE_ASSIGN"]))).toBe(true);
  });

  it("ignores permissions granted for other areas", () => {
    expect(
      isNavEntryVisible("CURRICULUM_READ", new Set(["SCHOOL_CLASS_READ"])),
    ).toBe(false);
  });

  it("falls back to visible for a code the catalog does not know", () => {
    // A stale gating code must not silently blank out a nav entry in the
    // preview while the real sidebar still renders it.
    expect(isNavEntryVisible("NOT_IN_CATALOG", new Set())).toBe(true);
  });
});

describe("NAV_PREVIEW_ENTRIES", () => {
  it("only gates on permission codes that exist in the catalog", () => {
    const catalogCodes = new Set(PERMISSION_CATALOG.map((entry) => entry.code));
    const unknown = NAV_PREVIEW_ENTRIES.filter(
      (entry) => entry.permissionCode && !catalogCodes.has(entry.permissionCode),
    ).map((entry) => entry.permissionCode);

    expect(unknown).toEqual([]);
  });

  it("has a unique label key per entry", () => {
    const keys = NAV_PREVIEW_ENTRIES.map((entry) => entry.labelKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every entry an icon", () => {
    expect(NAV_PREVIEW_ENTRIES.every((entry) => Boolean(entry.icon))).toBe(true);
  });

  it("renders every entry for a role holding all catalog permissions", () => {
    const allCodes = new Set(PERMISSION_CATALOG.map((entry) => entry.code));
    const hidden = NAV_PREVIEW_ENTRIES.filter(
      (entry) => !isNavEntryVisible(entry.permissionCode, allCodes),
    );

    expect(hidden).toEqual([]);
  });

  it("keeps only the ungated entries for a role without any permission", () => {
    const visible = NAV_PREVIEW_ENTRIES.filter((entry) =>
      isNavEntryVisible(entry.permissionCode, new Set()),
    );

    expect(visible.every((entry) => !entry.permissionCode)).toBe(true);
    expect(visible.length).toBeGreaterThan(0);
  });
});
