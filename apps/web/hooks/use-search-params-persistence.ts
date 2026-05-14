"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useSearchParamsPersistence<
  T extends Record<string, string | number | undefined>,
>() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getInitialValues = useCallback(
    (defaults: T): T => {
      const values = { ...defaults };

      for (const key of Object.keys(defaults)) {
        const param = searchParams.get(key);
        if (param !== null) {
          const defaultValue = defaults[key];
          if (typeof defaultValue === "number") {
            values[key as keyof T] = Number(param) as T[keyof T];
          } else {
            values[key as keyof T] = param as T[keyof T];
          }
        }
      }

      return values;
    },
    [searchParams],
  );

  const persistValues = useCallback(
    (values: Partial<T>, defaults: T) => {
      const params = new URLSearchParams();

      for (const [key, value] of Object.entries(values)) {
        if (
          value !== undefined &&
          value !== "" &&
          value !== defaults[key as keyof T]
        ) {
          params.set(key, String(value));
        }
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(newUrl, { scroll: false });
    },
    [pathname, router],
  );

  const clearParams = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const hasSearchParams = searchParams.toString().length > 0;

  return {
    getInitialValues,
    persistValues,
    clearParams,
    hasSearchParams,
    searchParams,
  };
}
