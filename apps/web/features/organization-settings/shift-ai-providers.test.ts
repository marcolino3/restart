import { describe, expect, it } from "vitest";

import {
  defaultShiftAiModel,
  isShiftAiProvider,
  SHIFT_AI_PROVIDERS,
  shiftAiNeedsOwnKey,
} from "./shift-ai-providers";

describe("shift AI providers", () => {
  it("has a default model for every provider with its own key", () => {
    for (const provider of SHIFT_AI_PROVIDERS) {
      if (shiftAiNeedsOwnKey(provider)) {
        expect(defaultShiftAiModel(provider)).not.toBe("");
      }
    }
  });

  it("reuses the contract settings without an own key or model", () => {
    expect(shiftAiNeedsOwnKey("contracts")).toBe(false);
    expect(defaultShiftAiModel("contracts")).toBe("");
  });

  it("rejects unknown provider values from stored settings", () => {
    expect(isShiftAiProvider("openai")).toBe(true);
    expect(isShiftAiProvider("__proto__")).toBe(false);
    expect(isShiftAiProvider("")).toBe(false);
  });
});
