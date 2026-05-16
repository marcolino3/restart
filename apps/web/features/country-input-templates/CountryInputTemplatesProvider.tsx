"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";
import {
  CountryInputFieldType,
  CountryInputTemplate,
} from "./types";

type CountryInputTemplatesContextValue = {
  templates: CountryInputTemplate[];
  byKey: Map<string, CountryInputTemplate>;
};

const CountryInputTemplatesContext =
  createContext<CountryInputTemplatesContextValue | null>(null);

const keyOf = (countryCode: string, fieldType: CountryInputFieldType) =>
  `${countryCode.toUpperCase()}::${fieldType}`;

export const CountryInputTemplatesProvider = ({
  templates,
  children,
}: {
  templates: CountryInputTemplate[];
  children: ReactNode;
}) => {
  const value = useMemo<CountryInputTemplatesContextValue>(() => {
    const byKey = new Map<string, CountryInputTemplate>();
    for (const t of templates) {
      byKey.set(keyOf(t.countryCode, t.fieldType), t);
    }
    return { templates, byKey };
  }, [templates]);

  return (
    <CountryInputTemplatesContext.Provider value={value}>
      {children}
    </CountryInputTemplatesContext.Provider>
  );
};

/**
 * Liefert das Template für (countryCode, fieldType) oder null wenn nichts
 * konfiguriert ist. Fällt auf das Wildcard-Template '*' zurück, falls
 * vorhanden. Komponenten sollten bei `null` ein neutrales Plain-Input
 * rendern.
 */
export const useCountryTemplate = (
  countryCode: string | null | undefined,
  fieldType: CountryInputFieldType,
): CountryInputTemplate | null => {
  const ctx = useContext(CountryInputTemplatesContext);
  if (!ctx) return null;
  if (countryCode) {
    const exact = ctx.byKey.get(keyOf(countryCode, fieldType));
    if (exact) return exact;
  }
  return ctx.byKey.get(keyOf("*", fieldType)) ?? null;
};
