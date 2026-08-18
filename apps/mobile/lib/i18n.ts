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

// The messages are shared with the web app, which runs them through next-intl
// and so writes interpolations as `{name}`. i18n-js looks for `%{name}` by
// default and would leave ours in the output verbatim, so point it at the ICU
// form instead.
i18n.placeholder = /(?:\{(\w+)\})/g;

const deviceLocale = (getLocales()[0]?.languageCode ?? defaultLocale) as Locale;
i18n.locale = ["de", "en"].includes(deviceLocale) ? deviceLocale : defaultLocale;

export const t = (key: string, options?: object) => i18n.t(key, options);
