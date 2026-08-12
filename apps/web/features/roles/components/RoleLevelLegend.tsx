"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { LEVEL_ORDER, levelBadgeVariant } from "../lib/level-meta";

export function RoleLevelLegend() {
  const t = useTranslations("Roles");

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{t("overview.legendLabel")}</span>
      {LEVEL_ORDER.map((level) => (
        <span key={level} className="flex items-center gap-1.5">
          <Badge variant={levelBadgeVariant(level)} className="size-3 rounded-full p-0" />
          {level === 3 ? t("overview.legendLevelFull") : t(`level.${level}` as const)}
        </span>
      ))}
    </div>
  );
}
