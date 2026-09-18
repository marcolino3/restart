/** Formats an amount in the given ISO currency for the active locale. */
export const formatMoney = (
  amount: number,
  currency: string,
  locale: string,
): string =>
  new Intl.NumberFormat(locale === "de" ? "de-CH" : "en-CH", {
    style: "currency",
    currency,
  }).format(amount);

/** Share of the budget that is spent, in whole percent; null without budget. */
export const spentPercent = (
  spent: number,
  budget: number | null,
): number | null => {
  if (budget === null || budget <= 0) return null;
  return Math.round((spent / budget) * 100);
};
