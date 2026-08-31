import { describe, expect, it } from "vitest";

import {
  NAMED_COLOR_HUES,
  NAMED_COLOR_PALETTE,
  NAMED_COLOR_SHADES,
  findNamedColor,
} from "./NamedColorPickerFormField";

describe("findNamedColor", () => {
  it("resolves palette colours case-insensitively", () => {
    expect(findNamedColor("#6c9c5b")).toEqual({ hue: "green", shade: "mid" });
    expect(findNamedColor("#6C9C5B")).toEqual({ hue: "green", shade: "mid" });
  });

  it("returns null for custom or missing colours", () => {
    expect(findNamedColor("#123456")).toBeNull();
    expect(findNamedColor(null)).toBeNull();
  });

  it("has 27 unique valid hex values", () => {
    const all = NAMED_COLOR_HUES.flatMap((hue) =>
      NAMED_COLOR_SHADES.map((shade) => NAMED_COLOR_PALETTE[hue][shade]),
    );
    expect(all).toHaveLength(27);
    expect(new Set(all.map((c) => c.toLowerCase())).size).toBe(27);
    for (const hex of all) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });
});
