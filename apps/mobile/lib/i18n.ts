import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";

import deMessages from "@restart/shared-i18n/messages/de";
import enMessages from "@restart/shared-i18n/messages/en";
import { defaultLocale, type Locale } from "@restart/shared-i18n";

export const i18n = new I18n({
  de: deMessages,
  en: enMessages,
});

i18n.defaultLocale = defaultLocale;
i18n.enableFallback = true;

const deviceLocale = (getLocales()[0]?.languageCode ?? defaultLocale) as Locale;
i18n.locale = ["de", "en"].includes(deviceLocale) ? deviceLocale : defaultLocale;

export const t = (key: string, options?: object) => i18n.t(key, options);
