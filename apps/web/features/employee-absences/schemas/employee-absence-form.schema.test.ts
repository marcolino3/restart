import { describe, expect, it } from "vitest";
import { EmployeeAbsenceFormSchema } from "./employee-absence-form.schema";

describe("EmployeeAbsenceFormSchema", () => {
  const base = {
    employeeId: "8c45e8ad-e76d-4d52-9eed-4221dfd0967c",
    absenceCategoryId: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
  };

  it("accepts ISO strings from server-action serialization", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      includesTime: true,
      startDate: "2026-08-05T08:00:00.000Z",
      endDate: "2026-08-05T17:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.endDate).toBeInstanceOf(Date);
    }
  });

  it("accepts a future start date", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      startDate: new Date("2030-06-01T12:00:00.000Z"),
      endDate: new Date("2030-06-05T12:00:00.000Z"),
    });
    expect(result.success).toBe(true);
  });

  it("rejects endDate before startDate on the same day", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      includesTime: true,
      startDate: new Date("2026-08-03T14:00:00.000Z"),
      endDate: new Date("2026-08-03T08:00:00.000Z"),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "endDate")).toBe(
        true,
      );
    }
  });

  it("rejects endDate before startDate", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      startDate: new Date("2026-08-10T12:00:00.000Z"),
      endDate: new Date("2026-08-03T12:00:00.000Z"),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "endDate")).toBe(
        true,
      );
      expect(
        result.error.issues.some((i) => i.message === "endBeforeStart"),
      ).toBe(true);
    }
  });

  it("allows same calendar day without time", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      includesTime: false,
      startDate: new Date("2026-08-03T00:00:00.000Z"),
      endDate: new Date("2026-08-03T00:00:00.000Z"),
    });
    expect(result.success).toBe(true);
  });

  it("allows endDate on the same calendar day as startDate", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      includesTime: true,
      startDate: new Date("2026-08-03T08:00:00.000Z"),
      endDate: new Date("2026-08-03T18:00:00.000Z"),
    });
    expect(result.success).toBe(true);
  });

  it("accepts labeled certificates and additional documents", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      startDate: new Date("2026-08-03T08:00:00.000Z"),
      endDate: new Date("2026-08-05T08:00:00.000Z"),
      certificates: [
        { url: "/api/absence-certificates/a.pdf", label: "Erstattung" },
      ],
      additionalDocuments: [
        { url: "/api/absence-certificates/b.pdf", label: "Unfallmeldung" },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.certificates[0]?.label).toBe("Erstattung");
      expect(result.data.additionalDocuments[0]?.label).toBe("Unfallmeldung");
    }
  });

  it("rejects documents without a url", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      startDate: new Date("2026-08-03T08:00:00.000Z"),
      endDate: new Date("2026-08-05T08:00:00.000Z"),
      certificates: [{ url: "", label: "ignored" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects external document URLs", () => {
    const result = EmployeeAbsenceFormSchema.safeParse({
      ...base,
      startDate: new Date("2026-08-03T08:00:00.000Z"),
      endDate: new Date("2026-08-05T08:00:00.000Z"),
      certificates: [
        { url: "https://evil.example/fake.pdf", label: "Arztzeugnis" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
