import { describe, it, expect } from "vitest";

import { levelBadgeVariant, LEVEL_BADGE_VARIANT, INDIVIDUAL_BADGE_VARIANT } from "./level-meta";

describe("levelBadgeVariant", () => {
  it("maps each level to its badge variant", () => {
    expect(levelBadgeVariant(0)).toBe(LEVEL_BADGE_VARIANT[0]);
    expect(levelBadgeVariant(1)).toBe(LEVEL_BADGE_VARIANT[1]);
    expect(levelBadgeVariant(2)).toBe(LEVEL_BADGE_VARIANT[2]);
    expect(levelBadgeVariant(3)).toBe(LEVEL_BADGE_VARIANT[3]);
  });

  it("maps null (Individuell) to the individual variant", () => {
    expect(levelBadgeVariant(null)).toBe(INDIVIDUAL_BADGE_VARIANT);
  });
});
