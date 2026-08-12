import { describe, expect, it } from "vitest";
import {
  canSeeAbsences,
  canSeeAdmissions,
  canSeeClasses,
  canSeeContactPersons,
  canSeeCurricula,
  canSeeEmployees,
  canSeeLearningReports,
  canSeeParentPortal,
  canSeeProgress,
  canSeeProjects,
  canSeeTimeReport,
  canSeeTimeTracking,
  type NavVisibilityUser,
} from "./nav-visibility";

const employee = (
  overrides: Partial<NonNullable<NavVisibilityUser>> = {}
): NavVisibilityUser => ({
  isSuperAdmin: false,
  roles: ["EMPLOYEE"],
  permissions: [],
  timeTrackingEnabled: false,
  isProjectMember: false,
  enabledFeatures: [
    "TIME_TRACKING",
    "TIME_REPORTS",
    "ABSENCES",
    "EMPLOYEES",
    "CLASSES",
    "CURRICULA",
    "PROGRESS",
    "ADMISSIONS",
    "CONTACT_PERSONS",
    "PROJECTS",
    "MY_TASKS",
    "CHATS",
    "PROTOCOLS",
  ],
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
    expect(canSeeTimeTracking(employee({ roles: ["ORG_ADMIN"] }))).toBe(
      false
    );
    expect(canSeeTimeTracking(employee({ isSuperAdmin: true }))).toBe(false);
  });

  it("ist false ohne User", () => {
    expect(canSeeTimeTracking(null)).toBe(false);
    expect(canSeeTimeTracking(undefined)).toBe(false);
  });
});

describe("canSeeTimeReport", () => {
  it("erlaubt ORG_ADMIN, HR_MANAGER und SuperAdmin", () => {
    expect(canSeeTimeReport(employee({ roles: ["ORG_ADMIN"] }))).toBe(true);
    expect(canSeeTimeReport(employee({ roles: ["HR_MANAGER"] }))).toBe(true);
    expect(canSeeTimeReport(employee({ isSuperAdmin: true }))).toBe(true);
  });

  it("schliesst OFFICE aus", () => {
    expect(canSeeTimeReport(employee({ roles: ["OFFICE"] }))).toBe(false);
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

  it("verweigert trotz Rolle, wenn das Org-Feature deaktiviert ist", () => {
    expect(
      canSeeTimeReport(
        employee({ roles: ["ORG_ADMIN"], enabledFeatures: [] })
      )
    ).toBe(false);
  });
});

describe("Org-Feature-Helper (10 neue Keys)", () => {
  it("erlauben bei aktiviertem Feature", () => {
    expect(canSeeAbsences(employee())).toBe(true);
    expect(canSeeEmployees(employee())).toBe(true);
    expect(canSeeClasses(employee())).toBe(true);
    expect(canSeeCurricula(employee())).toBe(true);
    expect(canSeeProgress(employee())).toBe(true);
    expect(canSeeAdmissions(employee())).toBe(true);
    expect(canSeeContactPersons(employee())).toBe(true);
  });

  it("verweigern bei deaktiviertem Feature (Beta-Keys default aus)", () => {
    expect(canSeeAbsences(employee({ enabledFeatures: [] }))).toBe(false);
    expect(canSeeLearningReports(employee())).toBe(false);
    expect(canSeeParentPortal(employee())).toBe(false);
  });

  it("SuperAdmin sieht alles unabhängig vom Toggle-Stand", () => {
    expect(
      canSeeLearningReports(employee({ isSuperAdmin: true, enabledFeatures: [] }))
    ).toBe(true);
    expect(
      canSeeParentPortal(employee({ isSuperAdmin: true, enabledFeatures: [] }))
    ).toBe(true);
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
