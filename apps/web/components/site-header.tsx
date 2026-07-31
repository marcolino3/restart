"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { resolveRouteTitleKey } from "@/lib/route-title";

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations("SiteHeader");

  const titleKey = resolveRouteTitleKey(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-card transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-[650] tracking-[-0.01em]">{t(titleKey)}</h1>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
