"use client";

import { useLocale, useTranslations } from "next-intl";

import { RouteTabs, type RouteTab } from "@/components/common/RouteTabs";
import { ROUTES } from "@/constants/routes";

export function RecordKeepingTopNav() {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();

  const tabs: RouteTab[] = [
    {
      key: "recording",
      label: t("topTabRecording"),
      href: ROUTES.admin.recordKeeping(locale),
    },
    {
      key: "attention",
      label: t("topTabAttention"),
      href: ROUTES.admin.recordKeepingAttention(locale),
    },
    {
      key: "heatmap",
      label: t("topTabHeatmap"),
      href: ROUTES.admin.recordKeepingHeatmap(locale),
    },
    {
      key: "students",
      label: t("topTabStudents"),
      href: ROUTES.admin.recordKeepingStudents(locale),
    },
  ];

  return (
    <RouteTabs
      tabs={tabs}
      ariaLabel={t("title")}
      preserveSearchParams={["classId"]}
    />
  );
}
