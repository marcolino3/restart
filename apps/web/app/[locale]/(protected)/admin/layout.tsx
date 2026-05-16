import { AppSidebar } from "@/components/app-sidebar";
import { SheetProvider } from "@/components/providers/sheet-provider";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrganizationsAction } from "@/features/organizations/actions/get-organizations.action";
import { UserProvider } from "@/features/users/context/current-user.context";
import { getCountryInputTemplatesAction } from "@/features/country-input-templates/actions/get-country-input-templates.action";
import { CountryInputTemplatesProvider } from "@/features/country-input-templates/CountryInputTemplatesProvider";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import React from "react";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const locale = await getLocale();
  const [res, orgsRes, templatesRes] = await Promise.all([
    getCurrentUserAction(),
    getOrganizationsAction(),
    getCountryInputTemplatesAction(),
  ]);

  if (!res?.success) redirect(`/${locale}/sign-in`);

  // Multi-tenancy: every authenticated request must run in an org context.
  // Exception: SuperAdmin may operate without an active org (only sees the
  // global SuperAdmin nav). Everyone else lands on /select-org.
  if (!res.data.orgId && !res.data.isSuperAdmin) {
    redirect(`/${locale}/select-org`);
  }

  const organizations = res.data.isSuperAdmin && orgsRes.success ? orgsRes.data : undefined;

  return (
    <UserProvider user={res.data}>
      <CountryInputTemplatesProvider templates={templatesRes.data}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" organizations={organizations} />
        <SheetProvider>
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 m-6 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SheetProvider>
      </SidebarProvider>
      </CountryInputTemplatesProvider>
    </UserProvider>
  );
};

export default AdminLayout;
