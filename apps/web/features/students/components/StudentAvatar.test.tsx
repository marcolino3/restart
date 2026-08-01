import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { StudentAvatar } from "./StudentAvatar";

describe("StudentAvatar", () => {
  it("renders initials when no photoUrl is given", () => {
    render(<StudentAvatar firstName="Anna" lastName="Muster" />);
    expect(screen.getByText("AM")).toBeInTheDocument();
  });

  it("does not render a DiceBear placeholder image", () => {
    const { container } = render(
      <StudentAvatar firstName="Anna" lastName="Muster" />,
    );
    expect(container.innerHTML).not.toContain("dicebear");
    expect(container.querySelector('img[src*="dicebear"]')).toBeNull();
  });

  it("does not render a DiceBear image even when photoUrl is set (jsdom fallback)", () => {
    const { container } = render(
      <StudentAvatar
        firstName="Anna"
        lastName="Muster"
        photoUrl="https://example.com/photo.jpg"
      />,
    );
    expect(container.innerHTML).not.toContain("dicebear");
  });
});
