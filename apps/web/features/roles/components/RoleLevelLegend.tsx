"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { LEVEL_ORDER, levelBadgeVariant } from "../lib/level-meta";

export function RoleLevelLegend() {
  const t = useTranslations("Roles");

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {LEVEL_ORDER.map((level) => (
        <span key={level} className="flex items-center gap-1.5">
          <Badge variant={levelBadgeVariant(level)} className="size-2.5 rounded-full p-0" />
          {t(`level.${level}` as const)}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <Badge variant={levelBadgeVariant(null)} className="size-2.5 rounded-full p-0" />
        {t("level.individual")}
      </span>
    </div>
  );
}
