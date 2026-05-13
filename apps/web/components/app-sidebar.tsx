"use client";

import * as React from "react";
import {
  IconBuilding,
  IconCamera,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSchool,
  IconSearch,
  IconSettings,
  IconShieldLock,
  IconUsers,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavSuperAdmin } from "@/components/nav-super-admin";
import { NavUser } from "@/components/nav-user";
import { OrgSwitcher } from "@/components/org-switcher";
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
  usePermissions,
  useUser,
} from "@/features/users/context/current-user.context";
import { useLocale } from "next-intl";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations?: Organization[];
}

export function AppSidebar({ organizations, ...props }: AppSidebarProps) {
  const locale = useLocale();
  const { hasPermission } = usePermissions();
  const user = useUser();

  const isSuperAdmin = user?.isSuperAdmin ?? false;

  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "#",
        icon: IconDashboard,
      },
      {
        title: "Time Tracking",
        url: ROUTES.admin.myTimeTracking(locale),
        icon: IconListDetails,
      },
      {
        title: "Employees",
        url: ROUTES.admin.employees(locale),
        icon: IconUsers,
      },
      {
        title: "Team",
        url: "#",
        icon: IconUsers,
      },
      ...(hasPermission("SCHOOL_CLASS_READ")
        ? [
            {
              title: "Schulklassen",
              url: ROUTES.admin.schoolClasses(locale),
              icon: IconSchool,
            },
            {
              title: "Schüler",
              url: ROUTES.admin.students(locale),
              icon: IconUsers,
            },
          ]
        : []),
      ...(hasPermission("CONTACT_PERSON_READ")
        ? [
            {
              title: "Bezugspersonen",
              url: ROUTES.admin.contactPersons(locale),
              icon: IconUsers,
            },
          ]
        : []),
      ...(hasPermission("ROLE_ASSIGN")
        ? [
            {
              title: "Rollen & Berechtigungen",
              url: ROUTES.admin.roles(locale),
              icon: IconShieldLock,
            },
          ]
        : []),
    ],
    ...(isSuperAdmin
      ? {
          navSuperAdmin: [
            {
              title: "Organizations",
              url: ROUTES.admin.organizations(locale),
              icon: IconBuilding,
            },
            {
              title: "Users",
              url: ROUTES.admin.users(locale),
              icon: IconUsers,
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
        title: "Settings",
        url: "#",
        icon: IconSettings,
      },
      {
        title: "Get Help",
        url: "#",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ],
    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: IconDatabase,
      },
      {
        name: "Reports",
        url: "#",
        icon: IconReport,
      },
      {
        name: "Word Assistant",
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
                  <IconInnerShadowTop className="!size-5" />
                  <span className="text-base font-semibold">RMS</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {isSuperAdmin && data.navSuperAdmin && (
          <NavSuperAdmin items={data.navSuperAdmin} />
        )}
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
