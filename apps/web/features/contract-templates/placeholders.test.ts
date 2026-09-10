import { describe, expect, it } from "vitest";

import {
  CONTRACT_TEMPLATE_PLACEHOLDERS,
  fillSampleValues,
  PLACEHOLDER_SAMPLE_VALUES,
} from "./placeholders";

describe("fillSampleValues", () => {
  it("has a sample value for every documented placeholder", () => {
    for (const { token } of CONTRACT_TEMPLATE_PLACEHOLDERS) {
      expect(PLACEHOLDER_SAMPLE_VALUES[token]).toBeTruthy();
    }
  });

  it("replaces known tokens, tolerating inner whitespace", () => {
    const html = "<p>{{employeeFullName}} – {{ position }}</p>";
    expect(fillSampleValues(html)).toBe(
      `<p>${PLACEHOLDER_SAMPLE_VALUES.employeeFullName} – ${PLACEHOLDER_SAMPLE_VALUES.position}</p>`,
    );
  });

  it("keeps unknown tokens visible", () => {
    expect(fillSampleValues("<p>{{unknownToken}}</p>")).toBe(
      "<p>{{unknownToken}}</p>",
    );
  });

  it("does not resolve prototype properties as tokens", () => {
    expect(fillSampleValues("{{constructor}} {{toString}}")).toBe(
      "{{constructor}} {{toString}}",
    );
  });
});
