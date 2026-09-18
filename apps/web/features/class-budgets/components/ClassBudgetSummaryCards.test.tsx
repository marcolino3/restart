import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import type { ClassBudgetSummary } from "../types";
import { ClassBudgetSummaryCards } from "./ClassBudgetSummaryCards";

const messages = {
  ClassBudgets: {
    budget: "Budget",
    spent: "Ausgegeben",
    remaining: "Verbleibend",
    ofBudget: "des Budgets",
    noBudgetSet: "Kein Budget festgelegt",
    schoolYearLabel: "Schuljahr {label}",
    overBudgetTitle: "Budget überzogen",
    overBudgetText: "Das Budget ist um {amount} überschritten.",
    bookings: "{count, plural, one {# Buchung} other {# Buchungen}}",
    remainingPerMonth: "noch {count} Monate — {amount} pro Monat",
    perChild: "Pro Kind",
    children: "{count, plural, one {# Kind} other {# Kinder}}",
    noChildren: "Keine Kinder in der Klasse",
    budgetPerChild: "Budget {amount}",
  },
};

const base: ClassBudgetSummary = {
  schoolClassId: "class-1",
  schoolYear: {
    start: "2026-08-01",
    end: "2027-07-31",
    startYear: 2026,
    label: "2026/27",
  },
  budget: 1000,
  spent: 250,
  remaining: 750,
  isOverBudget: false,
  currency: "CHF",
  expenseCount: 6,
  studentCount: 18,
  byCategory: [],
};

const renderCards = (summary: ClassBudgetSummary) =>
  render(
    <NextIntlClientProvider locale="de" messages={messages}>
      <ClassBudgetSummaryCards summary={summary} />
    </NextIntlClientProvider>,
  );

describe("ClassBudgetSummaryCards", () => {
  it("shows budget, spending share and the remainder", () => {
    renderCards(base);
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByTestId("budget-remaining")).toHaveTextContent("750.00");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("colours the progress bar by the share that is spent", () => {
    const { unmount } = renderCards(base);
    expect(screen.getByTestId("budget-progress")).toHaveAttribute(
      "data-tone",
      "green",
    );
    unmount();
    renderCards({ ...base, spent: 960, remaining: 40 });
    expect(screen.getByTestId("budget-progress")).toHaveAttribute(
      "data-tone",
      "rose",
    );
  });

  it("breaks the spending down per child and counts the bookings", () => {
    renderCards({ ...base, budget: 4800, spent: 900, remaining: 3900 });
    expect(screen.getByText(/6 Buchungen/)).toBeInTheDocument();
    expect(screen.getByText(/50\.00/)).toBeInTheDocument();
    expect(screen.getByText(/18 Kinder · Budget CHF 266\.67/)).toBeInTheDocument();
  });

  it("shows no per-child figure for an empty class", () => {
    renderCards({ ...base, studentCount: 0 });
    expect(screen.getByText("Keine Kinder in der Klasse")).toBeInTheDocument();
  });

  it("warns on overrun without blocking anything", () => {
    renderCards({ ...base, spent: 1200, remaining: -200, isOverBudget: true });
    expect(screen.getByRole("alert")).toHaveTextContent("200.00");
    expect(screen.getByTestId("budget-remaining")).toHaveClass(
      "text-destructive",
    );
  });

  it("does not invent a remainder when no budget is set", () => {
    renderCards({ ...base, budget: null, remaining: -250 });
    expect(screen.getByText("Kein Budget festgelegt")).toBeInTheDocument();
    expect(screen.queryByTestId("budget-remaining")).not.toBeInTheDocument();
  });
});
