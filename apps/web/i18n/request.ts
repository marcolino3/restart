import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./rounting";
import deMessages from "@restart/shared-i18n/messages/de";
import enMessages from "@restart/shared-i18n/messages/en";

const MESSAGES: Record<string, Record<string, unknown>> = {
  de: deMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // FR and IT don't have their own UI message bundle yet — fall back to EN so
  // the chrome stays readable. Curriculum content still loads in the
  // requested locale because translations live in the database.
  return {
    locale,
    messages: MESSAGES[locale] ?? MESSAGES.en,
  };
});
