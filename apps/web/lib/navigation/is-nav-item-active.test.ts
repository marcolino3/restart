import { describe, expect, it } from "vitest";

import { isNavItemActive } from "./is-nav-item-active";

const DASHBOARD = "/de/admin";
const CLASSES = "/de/admin/school-classes";

describe("isNavItemActive", () => {
  it("highlights the exact page", () => {
    expect(isNavItemActive(CLASSES, CLASSES)).toBe(true);
    expect(isNavItemActive(DASHBOARD, DASHBOARD)).toBe(true);
  });

  it("keeps the section highlighted on its subpages", () => {
    expect(isNavItemActive(`${CLASSES}/edit/abc`, CLASSES)).toBe(true);
  });

  it("does not highlight a sibling whose path merely starts the same", () => {
    expect(isNavItemActive("/de/admin/school-classes-archive", CLASSES)).toBe(
      false,
    );
  });

  it("highlights the dashboard only on the dashboard itself", () => {
    // Every admin page lives under /de/admin, so the subpath rule would leave
    // the dashboard permanently highlighted.
    expect(isNavItemActive(CLASSES, DASHBOARD)).toBe(false);
    expect(isNavItemActive("/de/admin/employees", DASHBOARD)).toBe(false);
    expect(isNavItemActive("/de/admin/", DASHBOARD)).toBe(true);
  });

  it("applies the same rule in every locale", () => {
    expect(isNavItemActive("/en/admin/employees", "/en/admin")).toBe(false);
    expect(isNavItemActive("/en/admin", "/en/admin")).toBe(true);
  });

  it("never highlights a placeholder url", () => {
    expect(isNavItemActive(CLASSES, "#")).toBe(false);
  });

  it("handles a missing pathname", () => {
    expect(isNavItemActive(null, CLASSES)).toBe(false);
  });
});
