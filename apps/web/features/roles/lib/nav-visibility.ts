import {
  IconBook,
  IconBuildingCommunity,
  IconChartHistogram,
  IconClipboardCheck,
  IconClock,
  IconFileText,
  IconHeart,
  IconLayoutDashboard,
  IconLayoutKanban,
  IconListCheck,
  IconMessage,
  IconSchool,
  IconSettings,
  IconShield,
  IconSquareCheck,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

import { PERMISSION_CATALOG } from "../permission-catalog";

export type NavPreviewEntry = {
  labelKey: string;
  icon: Icon;
  /** Omit for entries always visible to every role (e.g. dashboard, employees overview). */
  permissionCode?: string;
};

// Mirrors the gating permission codes and icons used in components/app-sidebar.tsx, so
// "what this role sees" doesn't drift from the real sidebar.
export const NAV_PREVIEW_ENTRIES: NavPreviewEntry[] = [
  { labelKey: "dashboard", icon: IconLayoutDashboard },
  { labelKey: "timeTracking", icon: IconClock },
  { labelKey: "timeTrackingReport", icon: IconChartHistogram },
  { labelKey: "employees", icon: IconUsers },
  { labelKey: "students", icon: IconSchool, permissionCode: "SCHOOL_CLASS_READ" },
  { labelKey: "contactPersons", icon: IconHeart, permissionCode: "CONTACT_PERSON_READ" },
  { labelKey: "recordKeeping", icon: IconSquareCheck, permissionCode: "RECORD_KEEPING_READ" },
  { labelKey: "admissions", icon: IconClipboardCheck, permissionCode: "ADMISSION_APPLICATION_READ" },
  { labelKey: "projects", icon: IconLayoutKanban },
  { labelKey: "myTasks", icon: IconListCheck },
  { labelKey: "chats", icon: IconMessage },
  { labelKey: "protocols", icon: IconFileText },
  { labelKey: "teams", icon: IconUsers },
  { labelKey: "schoolClasses", icon: IconBuildingCommunity, permissionCode: "SCHOOL_CLASS_READ" },
  { labelKey: "curricula", icon: IconBook, permissionCode: "CURRICULUM_READ" },
  {
    labelKey: "timeTrackingSettings",
    icon: IconSettings,
    permissionCode: "EMPLOYEE_ABSENCE_CATEGORY_MANAGE",
  },
  { labelKey: "roles", icon: IconShield, permissionCode: "ROLE_ASSIGN" },
];

export function isNavEntryVisible(
  permissionCode: string | undefined,
  grantedCodes: Set<string>,
): boolean {
  if (!permissionCode) return true;
  const exists = PERMISSION_CATALOG.some((entry) => entry.code === permissionCode);
  if (!exists) return true;
  return grantedCodes.has(permissionCode);
}
