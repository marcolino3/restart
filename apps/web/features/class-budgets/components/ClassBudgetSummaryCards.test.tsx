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
