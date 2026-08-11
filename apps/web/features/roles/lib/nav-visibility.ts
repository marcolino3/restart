import { PERMISSION_CATALOG } from "../permission-catalog";

export type NavPreviewEntry = {
  labelKey: string;
  permissionCode: string;
};

// Mirrors the gating permission codes used in components/app-sidebar.tsx, so
// "what this role sees" doesn't drift from the real sidebar. Entries without
// an explicit hasPermission() check in the sidebar (e.g. dashboard, employees
// overview) are intentionally left out - they are visible to every role.
export const NAV_PREVIEW_ENTRIES: NavPreviewEntry[] = [
  { labelKey: "students", permissionCode: "SCHOOL_CLASS_READ" },
  { labelKey: "contactPersons", permissionCode: "CONTACT_PERSON_READ" },
  { labelKey: "recordKeeping", permissionCode: "RECORD_KEEPING_READ" },
  { labelKey: "admissions", permissionCode: "ADMISSION_APPLICATION_READ" },
  { labelKey: "curricula", permissionCode: "CURRICULUM_READ" },
  { labelKey: "timeTrackingSettings", permissionCode: "EMPLOYEE_ABSENCE_CATEGORY_MANAGE" },
  { labelKey: "roles", permissionCode: "ROLE_ASSIGN" },
  { labelKey: "dataProtection", permissionCode: "CONSENT_READ" },
];

export function isNavEntryVisible(permissionCode: string, grantedCodes: Set<string>): boolean {
  const exists = PERMISSION_CATALOG.some((entry) => entry.code === permissionCode);
  if (!exists) return true;
  return grantedCodes.has(permissionCode);
}
