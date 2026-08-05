import { describe, expect, it } from "vitest";
import {
  absenceDocumentAccessUrl,
  isAbsenceDocumentUrl,
  normalizeAbsenceDocuments,
} from "@restart/shared-schemas/employee-absences/absence-document";

describe("normalizeAbsenceDocuments", () => {
  it("returns empty array for non-arrays", () => {
    expect(normalizeAbsenceDocuments(null)).toEqual([]);
    expect(normalizeAbsenceDocuments("x")).toEqual([]);
  });

  it("converts legacy string URLs", () => {
    expect(
      normalizeAbsenceDocuments(["/api/absence-certificates/a.pdf"]),
    ).toEqual([{ url: "/api/absence-certificates/a.pdf", label: "" }]);
  });

  it("keeps labeled documents and trims values", () => {
    expect(
      normalizeAbsenceDocuments([
        { url: " /api/absence-certificates/a.pdf ", label: " Erstattung " },
        { url: "", label: "ignored" },
      ]),
    ).toEqual([
      { url: "/api/absence-certificates/a.pdf", label: "Erstattung" },
    ]);
  });
});

describe("isAbsenceDocumentUrl", () => {
  it("accepts uploaded certificate paths only", () => {
    expect(isAbsenceDocumentUrl("/api/absence-certificates/a.pdf")).toBe(true);
    expect(isAbsenceDocumentUrl("https://evil.example/a.pdf")).toBe(false);
    expect(isAbsenceDocumentUrl("/api/contract-documents/a.pdf")).toBe(false);
  });
});

describe("absenceDocumentAccessUrl", () => {
  it("appends employeeId for certificate downloads", () => {
    expect(
      absenceDocumentAccessUrl("/api/absence-certificates/a.pdf", "emp-1"),
    ).toBe("/api/absence-certificates/a.pdf?employeeId=emp-1");
  });
});
