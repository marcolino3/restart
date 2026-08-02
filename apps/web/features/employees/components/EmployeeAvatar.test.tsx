import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { EmployeeAvatar } from "./EmployeeAvatar";

describe("EmployeeAvatar", () => {
  it("renders the employee's initials", () => {
    render(<EmployeeAvatar firstName="Anna" lastName="Muster" />);
    expect(screen.getByText("AM")).toBeInTheDocument();
  });

  it("never renders an image", () => {
    const { container } = render(
      <EmployeeAvatar firstName="Anna" lastName="Muster" />,
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});
