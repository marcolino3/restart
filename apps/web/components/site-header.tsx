"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const ROUTE_TITLE_MAP: Record<string, string> = {
  "/admin/my-time-tracking": "timeTracking",
  "/admin/employees": "employees",
  "/admin/school-classes": "schoolClasses",
  "/admin/students": "students",
  "/admin/contact-persons": "contactPersons",
  "/admin/roles": "roles",
  "/admin/organizations": "organizations",
  "/admin/users": "users",
  "/admin/settings": "settings",
};

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations("SiteHeader");

  // Strip locale prefix (e.g. /de/admin/students -> /admin/students)
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");

  // Find the matching route (longest prefix match)
  let titleKey = "dashboard";
  for (const [route, key] of Object.entries(ROUTE_TITLE_MAP)) {
    if (pathWithoutLocale.startsWith(route)) {
      titleKey = key;
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{t(titleKey)}</h1>
      </div>
    </header>
  );
}
