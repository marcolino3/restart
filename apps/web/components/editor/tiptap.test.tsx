import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import Tiptap from "./tiptap";

describe("Tiptap", () => {
  beforeAll(() => {
    // jsdom has no layout engine; ProseMirror reads Range geometry on focus.
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
    Range.prototype.getBoundingClientRect = () => new DOMRect();
  });

  it("synchronizes external content without reporting a user edit", async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <Tiptap description="<p>Original</p>" onChange={onChange} />,
    );
    await waitFor(() =>
      expect(container.querySelector(".tiptap")).toHaveTextContent("Original"),
    );
    rerender(<Tiptap description="<p>Template</p>" onChange={onChange} />);
    await waitFor(() =>
      expect(container.querySelector(".tiptap")).toHaveTextContent("Template"),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("updates toolbar state after a formatting transaction", async () => {
    render(<Tiptap description="<p>Text</p>" onChange={vi.fn()} />);
    const bold = await screen.findByRole("button", { name: "Fett" });
    fireEvent.click(bold);
    await waitFor(() => expect(bold).toHaveAttribute("aria-pressed", "true"));
    fireEvent.click(bold);
    await waitFor(() => expect(bold).toHaveAttribute("aria-pressed", "false"));
  });
});
