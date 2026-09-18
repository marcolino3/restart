"use client";

import { useLocale, useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

import { formatMoney } from "../lib/format-money";
import type { ClassBudgetSummary } from "../types";

// Categories carry their own colour (picked by the admin); without one they
// fall back to the neutral status tone of the theme.
const FALLBACK_COLOR = "var(--st-slate-fg)";

interface Props {
  summary: ClassBudgetSummary;
}

/**
 * Panel "breakdown by category" from the design handoff: a stacked share bar,
 * the pie chart and one row per category with bar, amount and share.
 */
export function ExpenseCategoryPie({ summary }: Props) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();

  const spent = summary.byCategory.reduce((sum, row) => sum + row.total, 0);
  const rows = summary.byCategory
    .filter((row) => row.total > 0)
    .map((row) => ({
      id: row.category.id,
      name: row.category.name,
      total: row.total,
      share: spent > 0 ? (row.total / spent) * 100 : 0,
      color: row.category.color ?? FALLBACK_COLOR,
    }));
  const config: ChartConfig = Object.fromEntries(
    rows.map((row) => [row.id, { label: row.name, color: row.color }]),
  );

  return (
    <section
      className="@container rounded-card border bg-card px-5 py-[18px] shadow-card"
      data-testid="category-breakdown"
    >
      <h3 className="mb-4 text-[15px] font-[650]">{t("byCategory")}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noExpenses")}</p>
      ) : (
        <>
          <div
            className="mb-5 flex h-3 gap-0.5 overflow-hidden rounded-full"
            aria-hidden
          >
            {rows.map((row) => (
              <span
                key={row.id}
                className="h-full min-w-1"
                style={{ width: `${row.share}%`, backgroundColor: row.color }}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 items-center gap-6 @[640px]:grid-cols-[220px_1fr]">
            <ChartContainer
              config={config}
              className="mx-auto aspect-square w-full max-w-[220px]"
            >
              <PieChart>
                <ChartTooltip
                  formatter={(value, name) => [
                    formatMoney(Number(value), summary.currency, locale),
                    name,
                  ]}
                />
                <Pie
                  data={rows}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={50}
                  isAnimationActive={false}
                >
                  {rows.map((row) => (
                    <Cell key={row.id} fill={row.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="space-y-2.5">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="grid grid-cols-[minmax(150px,1.25fr)_minmax(70px,1fr)_auto_38px] items-center gap-x-3 gap-y-1.5 @max-[430px]:grid-cols-[1fr_auto_38px]"
                >
                  <span className="flex min-w-0 items-center gap-2 text-[13.5px] font-semibold">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="truncate">{row.name}</span>
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-field @max-[430px]:order-last @max-[430px]:col-span-full">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${row.share}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </span>
                  <span className="text-right font-mono text-[12.5px] font-semibold tabular-nums">
                    {formatMoney(row.total, summary.currency, locale)}
                  </span>
                  <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {Math.round(row.share)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
