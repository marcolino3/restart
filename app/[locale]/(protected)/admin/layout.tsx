import { AppSidebar } from "@/components/app-sidebar";
import { SheetProvider } from "@/components/providers/sheet-provider";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { UserProvider } from "@/features/users/context/current-user.context";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import React from "react";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const locale = await getLocale();
  const res = await getCurrentUserAction();

  if (!res?.success) redirect(`/${locale}/sign-in`);
  return (
    <UserProvider user={res.data}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
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
    </UserProvider>
  );
};

export default AdminLayout;
