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

  return {
    locale,
    messages: MESSAGES[locale],
  };
});
