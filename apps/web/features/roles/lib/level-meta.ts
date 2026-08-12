import type { PermissionLevel } from "../permission-catalog";

type BadgeVariant = "level0" | "level1" | "level2" | "level3" | "rose";

export const LEVEL_ORDER: PermissionLevel[] = [0, 1, 2, 3];

export const LEVEL_BADGE_VARIANT: Record<PermissionLevel, BadgeVariant> = {
  0: "level0",
  1: "level1",
  2: "level2",
  3: "level3",
};

export const INDIVIDUAL_BADGE_VARIANT: BadgeVariant = "rose";

export function levelBadgeVariant(level: PermissionLevel | null): BadgeVariant {
  return level === null ? INDIVIDUAL_BADGE_VARIANT : LEVEL_BADGE_VARIANT[level];
}
