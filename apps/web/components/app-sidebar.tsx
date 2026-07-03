"use client";

import * as React from "react";
import {
  IconBuilding,
  IconBuildingCommunity,
  IconCamera,
  IconChartHistogram,
  IconClock,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconHeart,
  IconHelp,
  IconFileText,
  IconLayoutDashboard,
  IconLayoutKanban,
  IconListCheck,
  IconReport,
  IconBook,
  IconClipboardCheck,
  IconSchool,
  IconSearch,
  IconSettings,
  IconShield,
  IconSquareCheck,
  IconStack2,
  IconUsers,
  IconWorld,
  IconCalendarOff,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavGroup } from "@/components/nav-group";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { OrgSwitcher } from "@/components/org-switcher";
import { ThemePicker } from "@/components/theme-picker";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/constants/routes";
import {
  canSeeProjects,
  canSeeTimeReport,
  canSeeTimeTracking,
} from "@/lib/navigation/nav-visibility";
import {
  isAdminPersona,
  usePermissions,
  useUser,
} from "@/features/users/context/current-user.context";
import { useLocale, useTranslations } from "next-intl";

type Organization = {
  id: string;
  name?: string | null;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations?: Organization[];
}

export function AppSidebar({ organizations, ...props }: AppSidebarProps) {
  const locale = useLocale();
  const t = useTranslations("SiteHeader");
  const tCommon = useTranslations("Common");
  const { hasPermission } = usePermissions();
  const user = useUser();

  const isSuperAdmin = user?.isSuperAdmin ?? false;
  // SuperAdmin always sees the org-admin block; otherwise persona must be
  // one of ADMIN/HR/OFFICE. Teacher/Student/Parent/Employee personas are
  // hard-blocked from the navOrg sidebar group regardless of permissions.
  const canSeeOrgAdmin = isSuperAdmin || isAdminPersona(user?.persona);

  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: t("dashboard"),
        url: "#",
        icon: IconLayoutDashboard,
      },
      // Zeiterfassung: nur wenn das Feature am eigenen Employee aktiviert ist.
      ...(canSeeTimeTracking(user)
        ? [
            {
              title: t("timeTracking"),
              url: ROUTES.admin.myTimeTracking(locale),
              icon: IconClock,
            },
          ]
        : []),
      // Zeitauswertung: ADMIN/HR + Teamleiter (OFFICE ausgeschlossen).
      ...(canSeeTimeReport(user)
        ? [
            {
              title: t("timeTrackingReport"),
              url: ROUTES.admin.timeTrackingReport(locale),
              icon: IconChartHistogram,
            },
          ]
        : []),
      {
        title: t("employees"),
        url: ROUTES.admin.employees(locale),
        icon: IconUsers,
      },
      ...(hasPermission("SCHOOL_CLASS_READ")
        ? [
            {
              title: t("students"),
              url: ROUTES.admin.students(locale),
              icon: IconSchool,
            },
          ]
        : []),
      ...(hasPermission("CONTACT_PERSON_READ")
        ? [
            {
              title: t("contactPersons"),
              url: ROUTES.admin.contactPersons(locale),
              icon: IconHeart,
            },
          ]
        : []),
      ...(hasPermission("RECORD_KEEPING_READ")
        ? [
            {
              title: t("recordKeeping"),
              url: ROUTES.admin.recordKeeping(locale),
              icon: IconSquareCheck,
            },
          ]
        : []),
      ...(hasPermission("ADMISSION_APPLICATION_READ")
        ? [
            {
              title: t("admissions"),
              url: ROUTES.admin.admissionsKanban(locale),
              icon: IconClipboardCheck,
            },
          ]
        : []),
      // Projekte: nur wenn Mitglied in mindestens einem Projekt (oder Manage-All).
      ...(canSeeProjects(user)
        ? [
            {
              title: t("projects"),
              url: ROUTES.admin.projects(locale),
              icon: IconLayoutKanban,
            },
          ]
        : []),
      {
        title: t("myTasks"),
        url: ROUTES.admin.myTasks(locale),
        icon: IconListCheck,
      },
      {
        title: t("protocols"),
        url: ROUTES.admin.protocols(locale),
        icon: IconFileText,
      },
    ],
    navOrg: canSeeOrgAdmin
      ? [
          {
            title: t("teams"),
            url: ROUTES.admin.teams(locale),
            icon: IconUsers,
          },
          ...(hasPermission("SCHOOL_CLASS_READ")
            ? [
                {
                  title: t("schoolClasses"),
                  url: ROUTES.admin.schoolClasses(locale),
                  icon: IconBuildingCommunity,
                },
                {
                  title: t("gradeLevels"),
                  url: ROUTES.admin.gradeLevels(locale),
                  icon: IconStack2,
                },
              ]
            : []),
          ...(hasPermission("CURRICULUM_READ")
            ? [
                {
                  title: t("curricula"),
                  url: ROUTES.admin.curricula(locale),
                  icon: IconBook,
                },
              ]
            : []),
          ...(hasPermission("EMPLOYEE_ABSENCE_CATEGORY_MANAGE")
            ? [
                {
                  title: t("absenceCategories"),
                  url: ROUTES.admin.absenceCategories(locale),
                  icon: IconCalendarOff,
                },
                {
                  title: t("timeTrackingSettings"),
                  url: ROUTES.admin.timeTrackingSettings(locale),
                  icon: IconSettings,
                },
              ]
            : []),
          ...(hasPermission("ROLE_ASSIGN")
            ? [
                {
                  title: t("roles"),
                  url: ROUTES.admin.roles(locale),
                  icon: IconShield,
                },
              ]
            : []),
        ]
      : [],
    ...(isSuperAdmin
      ? {
          navSuperAdmin: [
            {
              title: t("organizations"),
              url: ROUTES.admin.organizations(locale),
              icon: IconBuilding,
            },
            {
              title: t("users"),
              url: ROUTES.admin.users(locale),
              icon: IconUsers,
            },
            {
              title: t("countryTemplates"),
              url: ROUTES.admin.countryTemplates(locale),
              icon: IconWorld,
            },
          ],
        }
      : {}),
    navClouds: [
      {
        title: "Capture",
        icon: IconCamera,
        isActive: true,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
      {
        title: "Proposal",
        icon: IconFileDescription,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
      {
        title: "Prompts",
        icon: IconFileAi,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: tCommon("settings"),
        url: "#",
        icon: IconSettings,
      },
      {
        title: tCommon("getHelp"),
        url: "#",
        icon: IconHelp,
      },
      {
        title: tCommon("search"),
        url: "#",
        icon: IconSearch,
      },
    ],
    documents: [
      {
        name: tCommon("dataLibrary"),
        url: "#",
        icon: IconDatabase,
      },
      {
        name: tCommon("reports"),
        url: "#",
        icon: IconReport,
      },
      {
        name: tCommon("wordAssistant"),
        url: "#",
        icon: IconFileWord,
      },
    ],
  };
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        {isSuperAdmin && organizations ? (
          <OrgSwitcher
            organizations={organizations}
            currentOrgId={user?.orgId}
          />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="#">
                  <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-primary text-sm font-bold text-primary-foreground">
                    R
                  </span>
                  <span className="text-[17px] font-bold tracking-tight">
                    {user?.orgName ?? "Restart"}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {data.navOrg.length > 0 && (
          <NavGroup label={t("organizationGroup")} items={data.navOrg} />
        )}
        {isSuperAdmin && data.navSuperAdmin && (
          <NavGroup
            label={t("superAdminGroup")}
            items={data.navSuperAdmin}
          />
        )}
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <ThemePicker className="border-t border-sidebar-border pt-3 group-data-[collapsible=icon]:hidden" />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
