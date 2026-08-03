export type EmployeeFunctionLocale = "DE" | "FR" | "IT" | "EN";

export const EMPLOYEE_FUNCTION_LOCALES: EmployeeFunctionLocale[] = [
  "DE",
  "FR",
  "IT",
  "EN",
];

export type EmployeeFunctionTranslation = {
  locale: EmployeeFunctionLocale;
  name: string;
};

export type EmployeeFunctionItem = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isArchived: boolean;
  usageCount: number;
  translations: EmployeeFunctionTranslation[];
};

/** Returns name in preferred locale, falling back DE → EN → FR → IT. */
export function pickEmployeeFunctionName(
  item: { translations: EmployeeFunctionTranslation[]; name: string },
  preferred: string,
): string {
  const upper = preferred.toUpperCase() as EmployeeFunctionLocale;
  const order: EmployeeFunctionLocale[] = [upper, "DE", "EN", "FR", "IT"];
  for (const loc of order) {
    const hit = item.translations.find((t) => t.locale === loc);
    if (hit?.name) return hit.name;
  }
  return item.name || "—";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Resolves a contract position (function id or legacy label) for display. */
export function resolveEmployeeFunctionPosition(
  position: string | null | undefined,
  functions: EmployeeFunctionItem[],
  preferredLocale: string,
): string {
  if (!position) return "—";
  if (UUID_RE.test(position)) {
    const fn = functions.find((f) => f.id === position);
    if (fn) return pickEmployeeFunctionName(fn, preferredLocale);
  }
  const byDeName = functions.find((f) => f.name === position);
  if (byDeName) return pickEmployeeFunctionName(byDeName, preferredLocale);
  return position;
}
