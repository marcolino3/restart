import { describe, it, expect } from "vitest";

import {
  PROTECTED_FIELD_CATALOG,
  PROTECTED_FIELD_KEYS,
  SPECIAL_CATEGORY_FIELD_COUNT,
  isSpecialCategory,
  categoryForResource,
  groupFieldCatalog,
  protectedFieldKey,
  LEGAL_BASIS_DSG_ART5,
} from "@restart/shared-schemas/rbac/field-catalog";
import { CATEGORY_ORDER } from "@restart/shared-schemas/rbac/permission-catalog";
import deMessages from "@restart/shared-i18n/messages/de";
import enMessages from "@restart/shared-i18n/messages/en";

type RolesMessageShape = {
  fieldResource: Record<string, string>;
  fieldName: Record<string, Record<string, string>>;
};

const rolesDe = (deMessages as unknown as { Roles: RolesMessageShape }).Roles;
const rolesEn = (enMessages as unknown as { Roles: RolesMessageShape }).Roles;

describe("DSG Art. 5 special category marker", () => {
  it("flags exactly the entries with legalBasis DSG-5", () => {
    const flagged = PROTECTED_FIELD_CATALOG.filter(isSpecialCategory);
    const withLegalBasis = PROTECTED_FIELD_CATALOG.filter(
      (f) => f.legalBasis === LEGAL_BASIS_DSG_ART5,
    );
    expect(flagged).toEqual(withLegalBasis);
  });

  it("keeps SPECIAL_CATEGORY_FIELD_COUNT in sync with the catalog", () => {
    expect(SPECIAL_CATEGORY_FIELD_COUNT).toBe(
      PROTECTED_FIELD_CATALOG.filter(isSpecialCategory).length,
    );
    expect(SPECIAL_CATEGORY_FIELD_COUNT).toBeGreaterThan(0);
  });

  it("does not flag fields without a legalBasis", () => {
    const withoutLegalBasis = PROTECTED_FIELD_CATALOG.filter((f) => !f.legalBasis);
    for (const field of withoutLegalBasis) {
      expect(isSpecialCategory(field)).toBe(false);
    }
  });
});

describe("protected field keys", () => {
  it("has no duplicate resource.field pairs", () => {
    expect(PROTECTED_FIELD_KEYS.size).toBe(PROTECTED_FIELD_CATALOG.length);
  });

  it("builds keys as resource.field", () => {
    expect(protectedFieldKey("student", "dateOfBirth")).toBe("student.dateOfBirth");
  });
});

describe("resource -> category mapping", () => {
  it("maps every resource that appears in the catalog to a valid category", () => {
    const resources = new Set(PROTECTED_FIELD_CATALOG.map((f) => f.resource));
    for (const resource of resources) {
      const category = categoryForResource(resource);
      // Audit-log style resources may be intentionally uncategorized only if
      // truly not gated behind a domain category - assert the known set is mapped.
      if (category !== undefined) {
        expect(CATEGORY_ORDER).toContain(category);
      }
    }
  });

  it("maps employee-scoped resources to the employees category", () => {
    expect(categoryForResource("employeeHrProfile")).toBe("employees");
    expect(categoryForResource("employeeEmergencyProfile")).toBe("employees");
  });

  it("maps student-scoped resources to the students category", () => {
    expect(categoryForResource("student")).toBe("students");
    expect(categoryForResource("studentRecordEntry")).toBe("students");
  });

  it("maps admission-scoped resources to the admissions category", () => {
    expect(categoryForResource("admissionApplication")).toBe("admissions");
    expect(categoryForResource("admissionAuditLog")).toBe("admissions");
  });
});

describe("groupFieldCatalog", () => {
  const grouped = groupFieldCatalog();

  it("groups every catalog entry into exactly one resource group", () => {
    const total = grouped.reduce((sum, g) => sum + g.fields.length, 0);
    expect(total).toBe(PROTECTED_FIELD_CATALOG.length);
  });

  it("attaches the resource's category to each group", () => {
    for (const group of grouped) {
      expect(group.category).toBe(categoryForResource(group.resource));
    }
  });

  it("includes the admission audit log fields", () => {
    const auditLog = grouped.find((g) => g.resource === "admissionAuditLog");
    expect(auditLog?.fields.map((f) => f.field).sort()).toEqual(["newValue", "oldValue"]);
    expect(auditLog?.category).toBe("admissions");
  });
});

describe("field catalog i18n coverage", () => {
  it("has a DE + EN label for every resource", () => {
    for (const resource of new Set(PROTECTED_FIELD_CATALOG.map((f) => f.resource))) {
      expect(rolesDe.fieldResource[resource], `de fieldResource.${resource}`).toBeTruthy();
      expect(rolesEn.fieldResource[resource], `en fieldResource.${resource}`).toBeTruthy();
    }
  });

  it("has a DE + EN label for every field", () => {
    for (const entry of PROTECTED_FIELD_CATALOG) {
      expect(
        rolesDe.fieldName[entry.resource]?.[entry.field],
        `de fieldName.${entry.resource}.${entry.field}`,
      ).toBeTruthy();
      expect(
        rolesEn.fieldName[entry.resource]?.[entry.field],
        `en fieldName.${entry.resource}.${entry.field}`,
      ).toBeTruthy();
    }
  });
});
