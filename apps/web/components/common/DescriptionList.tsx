import { cn } from "@/lib/utils";
import { useFieldAccess } from "@/components/form/field-resource-context";

/**
 * Reusable key/value description list — extracted from the repeated inline
 * <dl>/<dt>/<dd> pattern (e.g. EmployeeHrTabView). Used for the onboarding
 * wizard summary sidebar and detail views.
 */
export function DescriptionList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <dl className={cn("divide-y divide-border", className)}>{children}</dl>;
}

export function DescriptionRow({
  label,
  children,
  muted,
  field,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  /** Render the value in a muted style (e.g. "pending" placeholders). */
  muted?: boolean;
  /** Catalog field name for `FieldResourceProvider`-gated rows — hides the whole row when unreadable. */
  field?: string;
}) {
  const access = useFieldAccess(field ?? "");
  if (field && !access.visible) return null;

  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-medium",
          muted && "font-normal text-muted-foreground",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
