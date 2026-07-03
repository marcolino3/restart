import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileThemeSync } from "@/components/providers/profile-theme-sync";

const setTheme = vi.fn();

vi.mock("@/components/providers/theme-provider", () => ({
  useTheme: () => ({ theme: "salbei", setTheme }),
}));

describe("ProfileThemeSync", () => {
  beforeEach(() => {
    setTheme.mockClear();
  });

  it("applies a valid membership theme once after mount", () => {
    const { rerender } = render(<ProfileThemeSync theme="lagune" />);

    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith("lagune");

    // Re-render with the same server value (e.g. after a local pick that the
    // server has not seen yet) must NOT revert the locally chosen theme.
    rerender(<ProfileThemeSync theme="lagune" />);
    expect(setTheme).toHaveBeenCalledTimes(1);
  });

  it("applies a changed server value (org switch)", () => {
    const { rerender } = render(<ProfileThemeSync theme="lagune" />);
    rerender(<ProfileThemeSync theme="wald" />);

    expect(setTheme).toHaveBeenLastCalledWith("wald");
    expect(setTheme).toHaveBeenCalledTimes(2);
  });

  it("ignores missing or unknown theme ids", () => {
    const { rerender } = render(<ProfileThemeSync theme={null} />);
    rerender(<ProfileThemeSync theme="not-a-theme" />);

    expect(setTheme).not.toHaveBeenCalled();
  });
});
