import type { PermissionLevel } from "../permission-catalog";

type BadgeVariant = "slate" | "sky" | "amber" | "green" | "rose";

export const LEVEL_ORDER: PermissionLevel[] = [0, 1, 2, 3];

export const LEVEL_BADGE_VARIANT: Record<PermissionLevel, BadgeVariant> = {
  0: "slate",
  1: "sky",
  2: "amber",
  3: "green",
};

export const INDIVIDUAL_BADGE_VARIANT: BadgeVariant = "rose";

export function levelBadgeVariant(level: PermissionLevel | null): BadgeVariant {
  return level === null ? INDIVIDUAL_BADGE_VARIANT : LEVEL_BADGE_VARIANT[level];
}
