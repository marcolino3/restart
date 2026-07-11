import { describe, it, expect } from "vitest";

import {
  PERMISSION_CATALOG,
  CATEGORY_ORDER,
  groupCatalog,
  type CategoryKey,
} from "./permission-catalog";
import deMessages from "@restart/shared-i18n/messages/de";
import enMessages from "@restart/shared-i18n/messages/en";

/**
 * Every backend permission code that a role can hold. Mirrors
 * `apps/backend/src/permissions/entities/permission-code.enum.ts`. If a code is
 * added there, add it here AND to PERMISSION_CATALOG — this test guards against
 * the drift that once hid whole feature areas (admissions/students/…) from the
 * role management UI.
 */
const BACKEND_CODES = [
  "ORG_DELETE",
  "ORG_TRANSFER_OWNERSHIP",
  "BILLING_MANAGE",
  "USER_INVITE",
  "USER_REMOVE",
  "ROLE_CREATE",
  "ROLE_DELETE",
  "ROLE_ASSIGN",
  "TEAM_CREATE",
  "TEAM_DELETE",
  "TEAM_MANAGE",
  "EMPLOYEE_READ",
  "EMPLOYEE_WRITE",
  "EMPLOYEE_ABSENCE_CATEGORY_READ",
  "EMPLOYEE_ABSENCE_CATEGORY_MANAGE",
  "TIMESHEET_READ",
  "TIMESHEET_WRITE",
  "SCHOOL_CLASS_READ",
  "SCHOOL_CLASS_WRITE",
  "SCHOOL_CLASS_DELETE",
  "CONTACT_PERSON_READ",
  "CONTACT_PERSON_WRITE",
  "CONTACT_PERSON_DELETE",
  "STUDENT_READ",
  "STUDENT_WRITE",
  "STUDENT_DELETE",
  "STUDENT_RECORD_READ",
  "STUDENT_RECORD_WRITE",
  "STUDENT_RECORD_DELETE",
  "STUDENT_RECORD_CATEGORY_WRITE",
  "ADMISSION_STAGE_READ",
  "ADMISSION_STAGE_MANAGE",
  "ADMISSION_APPLICATION_READ",
  "ADMISSION_APPLICATION_WRITE",
  "ADMISSION_APPLICATION_MOVE",
  "ADMISSION_APPLICATION_ENROLL",
  "ADMISSION_APPLICATION_DELETE",
  "ADMISSION_EMAIL_TEMPLATE_MANAGE",
  "ADMISSION_EMAIL_SEND",
  "FAMILY_READ",
  "FAMILY_WRITE",
  "CURRICULUM_LEVEL_READ",
  "CURRICULUM_LEVEL_MANAGE",
  "CURRICULUM_READ",
  "CURRICULUM_MANAGE",
  "RECORD_KEEPING_READ",
  "RECORD_KEEPING_WRITE",
  "RECORD_KEEPING_SETTINGS_MANAGE",
  "ADDRESS_READ",
  "ADDRESS_WRITE",
  "ADDRESS_DELETE",
  "PROJECT_READ",
  "PROJECT_CREATE",
  "PROJECT_MANAGE_ALL",
  "PROJECT_TEMPLATE_MANAGE",
  "PROTOCOL_READ",
  "PROTOCOL_WRITE",
  "PROTOCOL_DELETE",
  "CONSENT_READ",
  "CONSENT_MANAGE",
  "CONSENT_SETTINGS_MANAGE",
  "DATA_REQUEST_READ",
  "DATA_REQUEST_MANAGE",
  "RETENTION_READ",
  "RETENTION_MANAGE",
  "DATA_BREACH_READ",
  "DATA_BREACH_MANAGE",
  "VVT_READ",
  "VVT_MANAGE",
] as const;

const rolesDe = (deMessages as { Roles: Record<string, Record<string, string>> })
  .Roles;
const rolesEn = (enMessages as { Roles: Record<string, Record<string, string>> })
  .Roles;

describe("permission catalog ↔ backend enum parity", () => {
  it("lists every backend permission code exactly once", () => {
    const catalogCodes = PERMISSION_CATALOG.map((e) => e.code);
    const missing = BACKEND_CODES.filter((c) => !catalogCodes.includes(c));
    expect(missing).toEqual([]);
  });

  it("has no codes the backend does not define", () => {
    const extra = PERMISSION_CATALOG.map((e) => e.code).filter(
      (c) => !BACKEND_CODES.includes(c as (typeof BACKEND_CODES)[number]),
    );
    expect(extra).toEqual([]);
  });

  it("has no duplicate codes", () => {
    const codes = PERMISSION_CATALOG.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("permission catalog i18n coverage", () => {
  it("has a DE + EN label for every category used", () => {
    for (const entry of PERMISSION_CATALOG) {
      expect(rolesDe.category[entry.category], `de category.${entry.category}`)
        .toBeTruthy();
      expect(rolesEn.category[entry.category], `en category.${entry.category}`)
        .toBeTruthy();
    }
  });

  it("has a DE + EN label for every feature used", () => {
    for (const entry of PERMISSION_CATALOG) {
      expect(rolesDe.feature[entry.feature], `de feature.${entry.feature}`)
        .toBeTruthy();
      expect(rolesEn.feature[entry.feature], `en feature.${entry.feature}`)
        .toBeTruthy();
    }
  });

  it("has a DE + EN label for every action used", () => {
    for (const entry of PERMISSION_CATALOG) {
      expect(rolesDe.action[entry.action], `de action.${entry.action}`)
        .toBeTruthy();
      expect(rolesEn.action[entry.action], `en action.${entry.action}`)
        .toBeTruthy();
    }
  });

  it("orders every category that appears in the catalog", () => {
    const used = new Set<CategoryKey>(PERMISSION_CATALOG.map((e) => e.category));
    for (const c of used) expect(CATEGORY_ORDER).toContain(c);
  });
});

describe("groupCatalog", () => {
  it("groups visible codes by category and feature, hiding owner-only ones", () => {
    const all = new Set(PERMISSION_CATALOG.map((e) => e.code));
    const grouped = groupCatalog(all);

    // Owner-only (hidden) codes never surface.
    const surfaced = grouped.flatMap((g) => g.codes);
    expect(surfaced).not.toContain("ORG_DELETE");
    expect(surfaced).not.toContain("BILLING_MANAGE");

    // The admissions category surfaces the application read code (the one that
    // was previously unreachable in the UI).
    const admissions = grouped.find((g) => g.category === "admissions");
    expect(admissions?.codes).toContain("ADMISSION_APPLICATION_READ");
  });

  it("filters out codes the org does not have", () => {
    const grouped = groupCatalog(new Set(["STUDENT_READ"]));
    expect(grouped.flatMap((g) => g.codes)).toEqual(["STUDENT_READ"]);
  });
});
