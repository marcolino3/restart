import de from "../messages/de.json" with { type: "json" };
import en from "../messages/en.json" with { type: "json" };

export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Messages = typeof de & typeof en;

export const messages = { de, en } as Record<Locale, Messages>;
