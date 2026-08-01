import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { InitialsAvatar, getInitials } from "./InitialsAvatar";

describe("getInitials", () => {
  it("derives initials from first and last name", () => {
    expect(getInitials("Anna", "Muster")).toBe("AM");
  });

  it("falls back to '?' when both names are missing", () => {
    expect(getInitials(null, null)).toBe("?");
    expect(getInitials(undefined, undefined)).toBe("?");
  });

  it("returns a single letter when only one name is set", () => {
    expect(getInitials("Anna", null)).toBe("A");
    expect(getInitials(null, "Muster")).toBe("M");
  });

  it("uppercases lowercase names", () => {
    expect(getInitials("anna", "muster")).toBe("AM");
  });
});

describe("InitialsAvatar", () => {
  it("renders the initials fallback when no imageUrl is given", () => {
    render(<InitialsAvatar firstName="Anna" lastName="Muster" />);
    expect(screen.getByText("AM")).toBeInTheDocument();
  });

  it("does not render an img element when imageUrl is absent", () => {
    const { container } = render(
      <InitialsAvatar firstName="Anna" lastName="Muster" />,
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  // Note: Radix's AvatarImage only swaps in once the browser reports the
  // image as loaded, which never happens in jsdom (no real image loading).
  // So even with imageUrl set, only the fallback renders here — asserting an
  // <img> would be a false positive. We only verify the fallback still shows.
  it("still renders the initials fallback when imageUrl is set (jsdom does not load images)", () => {
    render(
      <InitialsAvatar
        firstName="Anna"
        lastName="Muster"
        imageUrl="https://example.com/photo.jpg"
      />,
    );
    expect(screen.getByText("AM")).toBeInTheDocument();
  });
});
