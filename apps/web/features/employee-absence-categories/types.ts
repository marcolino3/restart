export type AbsenceCategoryLocale = "DE" | "FR" | "IT" | "EN";

export const ABSENCE_CATEGORY_LOCALES: AbsenceCategoryLocale[] = [
  "DE",
  "FR",
  "IT",
  "EN",
];

export type AbsenceCategoryTranslation = {
  locale: AbsenceCategoryLocale;
  name: string;
  description?: string | null;
};

export type AbsenceCategorySystemCode =
  | "SICKNESS"
  | "ACCIDENT"
  | "CHILDCARE_SICK"
  | "TRAINING"
  | "FUNERAL"
  | "MOVE"
  | "MILITARY_SERVICE"
  | "CIVIL_SERVICE"
  | "OTHER";

export type AbsenceCategoryItem = {
  id: string;
  systemCode: AbsenceCategorySystemCode | null;
  isSystem: boolean;
  isActive: boolean;
  countsAsWorkTime: boolean;
  isPaid: boolean;
  affectsVacationBalance: boolean;
  defaultIsVacationCapable: boolean;
  reducesVacationEntitlementAfterDays: number | null;
  requiresCertificate: boolean;
  certificateRequiredFromDay: number | null;
  maxDaysPerYear: number | null;
  defaultPercentage: number;
  requiresApproval: boolean;
  color: string | null;
  iconName: string | null;
  sortOrder: number;
  translations: AbsenceCategoryTranslation[];
};

/** Returns name in preferred locale, falling back DE → EN → first available. */
export function pickAbsenceCategoryName(
  item: { translations: AbsenceCategoryTranslation[]; systemCode: string | null },
  preferred: string,
): string {
  const upper = preferred.toUpperCase() as AbsenceCategoryLocale;
  const order: AbsenceCategoryLocale[] = [upper, "DE", "EN", "FR", "IT"];
  for (const loc of order) {
    const hit = item.translations.find((t) => t.locale === loc);
    if (hit?.name) return hit.name;
  }
  return item.systemCode ?? "—";
}
