import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Card wrapper for tables (`.tbl` in `docs/design/styles.css`): white panel,
 * theme card radius, hairline border and the subtle card shadow.
 *
 * `overflow-hidden` keeps the first/last row from bleeding past the rounded
 * corners. Always wrap a `<Table>` in this instead of an ad-hoc
 * `rounded-md border` div — that variant has no background, so the table
 * inherits the tinted page background instead of the white panel.
 */
export const TableCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden rounded-card border bg-card shadow-card",
      className,
    )}
    {...props}
  />
));
TableCard.displayName = "TableCard";
