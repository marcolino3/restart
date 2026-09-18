"use client";

import { useLocale, useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

import { formatMoney } from "../lib/format-money";
import type { ClassBudgetSummary } from "../types";

const FALLBACK_COLOR = "#94A3B8";

interface Props {
  summary: ClassBudgetSummary;
}

export function ExpenseCategoryPie({ summary }: Props) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();

  const rows = summary.byCategory
    .filter((row) => row.total > 0)
    .map((row) => ({
      id: row.category.id,
      name: row.category.name,
      total: row.total,
      color: row.category.color ?? FALLBACK_COLOR,
    }));
  const config: ChartConfig = Object.fromEntries(
    rows.map((row) => [row.id, { label: row.name, color: row.color }]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("byCategory")}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noExpenses")}</p>
        ) : (
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <ChartContainer config={config} className="mx-auto aspect-square max-h-[220px]">
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
            <ul className="space-y-2 text-sm">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="flex-1 truncate">{row.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(row.total, summary.currency, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
