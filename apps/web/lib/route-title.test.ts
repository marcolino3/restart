import { describe, expect, it } from "vitest";

import de from "@restart/shared-i18n/messages/de";
import en from "@restart/shared-i18n/messages/en";

import {
  DEFAULT_ROUTE_TITLE_KEY,
  ROUTE_TITLE_MAP,
  resolveRouteTitleKey,
  stripLocalePrefix,
} from "./route-title";

describe("stripLocalePrefix", () => {
  it("removes a leading locale segment", () => {
    expect(stripLocalePrefix("/de/admin/students")).toBe("/admin/students");
    expect(stripLocalePrefix("/en/admin/students")).toBe("/admin/students");
  });

  it("leaves paths without a locale prefix untouched", () => {
    expect(stripLocalePrefix("/admin/students")).toBe("/admin/students");
  });

  it("does not eat a two-letter first segment that is not a locale boundary", () => {
    // `/admin` must not lose its first two characters.
    expect(stripLocalePrefix("/administration")).toBe("/administration");
  });
});

describe("resolveRouteTitleKey", () => {
  it("falls back to the dashboard key for the admin root", () => {
    expect(resolveRouteTitleKey("/de/admin")).toBe(DEFAULT_ROUTE_TITLE_KEY);
  });

  // Regression: these routes were missing from the map and all rendered
  // "Dashboard" in the header bar.
  it.each([
    ["/de/admin/projects", "projects"],
    ["/de/admin/teams", "teams"],
    ["/de/admin/admissions", "admissions"],
    ["/de/admin/my-tasks", "myTasks"],
    ["/de/admin/chats", "chats"],
    ["/de/admin/protocols", "protocols"],
    ["/de/admin/curricula", "curricula"],
    ["/de/admin/data-protection", "dataProtection"],
    ["/de/admin/grade-levels", "gradeLevels"],
    ["/de/admin/absence-categories", "absenceCategories"],
    ["/de/admin/time-tracking-report", "timeTrackingReport"],
    ["/de/admin/time-tracking-settings", "timeTrackingSettings"],
  ])("resolves %s to %s", (pathname, expected) => {
    expect(resolveRouteTitleKey(pathname)).toBe(expected);
  });

  it("keeps the title on nested detail routes", () => {
    expect(resolveRouteTitleKey("/de/admin/students/123/edit")).toBe("students");
    expect(resolveRouteTitleKey("/en/admin/teams/abc")).toBe("teams");
  });

  // Regression: the old loop took the LAST match in object order rather than
  // the longest prefix, so nested routes inherited their parent's title.
  it("prefers the longest matching prefix over a parent route", () => {
    expect(resolveRouteTitleKey("/de/admin/settings/country-templates")).toBe(
      "countryTemplates",
    );
    expect(resolveRouteTitleKey("/de/admin/settings")).toBe("settings");
    expect(resolveRouteTitleKey("/de/admin/projects/templates")).toBe(
      "projectTemplates",
    );
    expect(resolveRouteTitleKey("/de/admin/projects/some-id")).toBe("projects");
  });

  // Regression: `startsWith` matched across segment boundaries, so a route
  // like `/admin/students-archive` would have been titled "students".
  it("only matches on segment boundaries", () => {
    expect(resolveRouteTitleKey("/de/admin/students-archive")).toBe(
      DEFAULT_ROUTE_TITLE_KEY,
    );
  });
});

describe("route title translations", () => {
  const keys = [...Object.values(ROUTE_TITLE_MAP), DEFAULT_ROUTE_TITLE_KEY];

  it.each(keys)("has a German translation for %s", (key) => {
    expect(de.SiteHeader).toHaveProperty(key);
  });

  it.each(keys)("has an English translation for %s", (key) => {
    expect(en.SiteHeader).toHaveProperty(key);
  });
});
