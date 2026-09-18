import { describe, expect, it } from "vitest";

import type { ClassExpense } from "../types";
import { expensesToCsv, filterExpenses } from "./expenses-csv";

const headers = {
  expenseDate: "Datum",
  category: "Kategorie",
  vendor: "Lieferant",
  invoiceNumber: "Rechnungsnummer",
  description: "Beschreibung",
  amount: "Betrag",
  currency: "Währung",
};

const expense = (overrides: Partial<ClassExpense>): ClassExpense =>
  ({
    id: "e1",
    schoolClassId: "k1",
    category: { id: "c1", name: "Material", color: null },
    expenseDate: "2026-09-01",
    amount: 120.5,
    currency: "CHF",
    vendor: "Papeterie Meier",
    invoiceNumber: "R-1",
    description: "Hefte",
    receiptFileId: null,
    createdByMembershipId: null,
    canModify: true,
    ...overrides,
  }) as ClassExpense;

describe("expensesToCsv", () => {
  it("writes a header and one quoted line per expense", () => {
    const csv = expensesToCsv([expense({})], headers);
    const lines = csv.trimEnd().split("\r\n");

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      '"2026-09-01";"Material";"Papeterie Meier";"R-1";"Hefte";"120.5";"CHF"',
    );
  });

  it("defuses cells a spreadsheet would run as a formula", () => {
    const csv = expensesToCsv(
      [expense({ vendor: '=HYPERLINK("http://x")', description: null })],
      headers,
    );
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
  });
});

describe("filterExpenses", () => {
  const expenses = [
    expense({}),
    expense({ id: "e2", vendor: "SBB", description: "Ausflug Bern" }),
  ];

  it("matches vendor and description, ignoring case", () => {
    expect(filterExpenses(expenses, "sbb").map((e) => e.id)).toEqual(["e2"]);
    expect(filterExpenses(expenses, "HEFTE").map((e) => e.id)).toEqual(["e1"]);
  });

  it("keeps everything for a blank query", () => {
    expect(filterExpenses(expenses, "  ")).toHaveLength(2);
  });
});
