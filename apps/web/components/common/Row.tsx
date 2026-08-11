"use client";

import type { ReactNode } from "react";

import { useFieldAccess } from "@/components/form/field-resource-context";

interface RowProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Catalog field name for `FieldResourceProvider`-gated rows — hides the whole row when unreadable. */
  field?: string;
}

/**
 * Shared `<dt>`/`<dd>` detail row — consolidates the identical local copies
 * previously duplicated in `EmployeeHrTabView.tsx` and
 * `EmployeeEmergencyTabView.tsx`.
 */
export function Row({ label, value, icon, field }: RowProps) {
  const access = useFieldAccess(field ?? "");
  if (field && !access.visible) return null;

  return (
    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm/6 font-medium text-foreground flex items-center gap-2">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0 whitespace-pre-line">
        {value}
      </dd>
    </div>
  );
}
