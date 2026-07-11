import { AppSidebar } from "@/components/app-sidebar";
import { ProfileThemeSync } from "@/components/providers/profile-theme-sync";
import { SheetProvider } from "@/components/providers/sheet-provider";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrganizationsAction } from "@/features/organizations/actions/get-organizations.action";
import { UserProvider } from "@/features/users/context/current-user.context";
import { getCountryInputTemplatesAction } from "@/features/country-input-templates/actions/get-country-input-templates.action";
import { CountryInputTemplatesProvider } from "@/features/country-input-templates/CountryInputTemplatesProvider";
import { getImpersonationInfoAction } from "@/features/auth/actions/get-impersonation-info.action";
import { ImpersonationBanner } from "@/features/auth/components/ImpersonationBanner";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import React from "react";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const locale = await getLocale();
  const [res, orgsRes, templatesRes, impersonationInfo] = await Promise.all([
    getCurrentUserAction(),
    getOrganizationsAction(),
    getCountryInputTemplatesAction(),
    getImpersonationInfoAction(),
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
      <ProfileThemeSync theme={res.data.theme} />
      <CountryInputTemplatesProvider templates={templatesRes.data}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "260px",
            "--header-height": "60px",
          } as React.CSSProperties
        }
      >
        <AppSidebar organizations={organizations} />
        <SheetProvider>
          <SidebarInset>
            {impersonationInfo.isImpersonating && (
              <ImpersonationBanner asUserName={impersonationInfo.asUserName} />
            )}
            <SiteHeader />
            {/* On full-bleed pages the whole content column is pinned to the
                viewport height under the header, so children can fill it with
                flex-1 (no per-component viewport math). Other pages keep their
                natural min-height / scroll behaviour. */}
            <div className="flex flex-1 flex-col has-[[data-full-bleed]]:h-[calc(100svh-var(--header-height,3.5rem))] has-[[data-full-bleed]]:flex-none has-[[data-full-bleed]]:min-h-0">
              <div className="@container/main flex flex-1 flex-col gap-2 has-[[data-full-bleed]]:min-h-0">
                {/* Standard content padding, EXCEPT for full-bleed pages (e.g.
                    the chat messenger): a page can render a `[data-full-bleed]`
                    element to drop the margin/padding and fill the area edge to
                    edge. `:has()` keeps every other page unchanged. */}
                <div className="flex flex-1 flex-col gap-4 py-4 m-6 md:gap-6 md:py-6 has-[[data-full-bleed]]:m-0 has-[[data-full-bleed]]:min-h-0 has-[[data-full-bleed]]:gap-0 has-[[data-full-bleed]]:p-0">
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
