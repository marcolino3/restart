"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  locale: string;
};

export const SettingsTabNav = ({ locale }: Props) => {
  const t = useTranslations("OrganizationSettings");
  const pathname = usePathname();

  const items = [
    {
      value: "general",
      href: `/${locale}/admin/settings`,
      label: t("tabGeneral"),
    },
    {
      value: "smtp",
      href: `/${locale}/admin/settings/smtp`,
      label: t("tabSmtp"),
    },
    {
      value: "recordKeeping",
      href: `/${locale}/admin/settings/record-keeping`,
      label: t("tabRecordKeeping"),
    },
    {
      value: "sickLeave",
      href: `/${locale}/admin/settings/sick-leave`,
      label: t("tabSickLeave"),
    },
  ];

  // Die Unterseiten sind eigene Routen — der aktive Tab kommt daher aus dem
  // Pfad, nicht aus lokalem State.
  const active =
    items.find(
      (item) =>
        item.href !== `/${locale}/admin/settings` &&
        pathname.startsWith(item.href),
    )?.value ?? "general";

  return (
    <Tabs value={active}>
      <TabsList>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} asChild>
            <Link href={item.href}>{item.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
