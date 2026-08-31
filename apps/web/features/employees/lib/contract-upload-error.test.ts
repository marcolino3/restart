import { describe, expect, it } from "vitest";

import { contractUploadErrorKey } from "./contract-upload-error";

/**
 * Regression: a failed upload showed the backend's raw `message`, which for an
 * unhandled storage error was the useless "Internal server error" — and in the
 * onboarding wizard it showed nothing at all.
 */
describe("contractUploadErrorKey", () => {
  it("maps an oversized file to its own message", () => {
    expect(contractUploadErrorKey(413)).toBe("docTooLarge");
  });

  it("maps a rejected file type to the PDF hint", () => {
    expect(contractUploadErrorKey(400)).toBe("docPdfOnly");
  });

  it.each([401, 403])("maps %i to a permission message", (status) => {
    expect(contractUploadErrorKey(status)).toBe("docForbidden");
  });

  it("maps a storage outage to a retry message", () => {
    expect(contractUploadErrorKey(503)).toBe("docStorageUnavailable");
  });

  it("falls back to the generic message for anything else", () => {
    expect(contractUploadErrorKey(500)).toBe("docUploadError");
    expect(contractUploadErrorKey(418)).toBe("docUploadError");
  });
});
