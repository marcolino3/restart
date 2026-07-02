import { describe, expect, it } from "vitest";
import {
  canSeeProjects,
  canSeeTimeReport,
  canSeeTimeTracking,
  type NavVisibilityUser,
} from "./nav-visibility";

const employee = (
  overrides: Partial<NonNullable<NavVisibilityUser>> = {}
): NavVisibilityUser => ({
  isSuperAdmin: false,
  persona: "EMPLOYEE",
  roles: ["EMPLOYEE"],
  permissions: [],
  timeTrackingEnabled: false,
  isProjectMember: false,
  ...overrides,
});

describe("canSeeTimeTracking", () => {
  it("zeigt Zeiterfassung nur bei aktiviertem Employee-Flag", () => {
    expect(canSeeTimeTracking(employee({ timeTrackingEnabled: true }))).toBe(
      true
    );
    expect(canSeeTimeTracking(employee())).toBe(false);
  });

  it("versteckt Zeiterfassung auch für Admins ohne Flag", () => {
    expect(canSeeTimeTracking(employee({ persona: "ADMIN" }))).toBe(false);
    expect(canSeeTimeTracking(employee({ isSuperAdmin: true }))).toBe(false);
  });

  it("ist false ohne User", () => {
    expect(canSeeTimeTracking(null)).toBe(false);
    expect(canSeeTimeTracking(undefined)).toBe(false);
  });
});

describe("canSeeTimeReport", () => {
  it("erlaubt ADMIN, HR und SuperAdmin", () => {
    expect(canSeeTimeReport(employee({ persona: "ADMIN" }))).toBe(true);
    expect(canSeeTimeReport(employee({ persona: "HR" }))).toBe(true);
    expect(canSeeTimeReport(employee({ isSuperAdmin: true }))).toBe(true);
  });

  it("schliesst OFFICE aus", () => {
    expect(canSeeTimeReport(employee({ persona: "OFFICE" }))).toBe(false);
  });

  it("erlaubt Teamleiter über die TEAM_LEAD-Rolle", () => {
    expect(
      canSeeTimeReport(employee({ roles: ["EMPLOYEE", "TEAM_LEAD"] }))
    ).toBe(true);
  });

  it("verweigert reine Mitarbeiter und fehlende User", () => {
    expect(canSeeTimeReport(employee())).toBe(false);
    expect(canSeeTimeReport(null)).toBe(false);
  });
});

describe("canSeeProjects", () => {
  it("zeigt Projekte für Projekt-Mitglieder", () => {
    expect(canSeeProjects(employee({ isProjectMember: true }))).toBe(true);
  });

  it("zeigt Projekte für PROJECT_MANAGE_ALL und SuperAdmin ohne Mitgliedschaft", () => {
    expect(
      canSeeProjects(employee({ permissions: ["PROJECT_MANAGE_ALL"] }))
    ).toBe(true);
    expect(canSeeProjects(employee({ isSuperAdmin: true }))).toBe(true);
  });

  it("versteckt Projekte ohne Mitgliedschaft — auch mit PROJECT_READ", () => {
    expect(canSeeProjects(employee({ permissions: ["PROJECT_READ"] }))).toBe(
      false
    );
    expect(canSeeProjects(null)).toBe(false);
  });
});
