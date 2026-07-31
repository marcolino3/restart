"use client";

import * as React from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ViewOption<T extends string> {
  value: T;
  /** Already-translated label. */
  label: string;
  icon?: React.ReactNode;
}

interface Props<T extends string> {
  options: ViewOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group, e.g. "Ansicht wechseln". */
  label: string;
  className?: string;
}

/**
 * Switches between views of the same data (cards / table / board).
 *
 * Built on the shared Tabs primitive so every list in the app looks and
 * behaves alike — school classes, projects and tasks each had their own
 * hand-rolled toggle before, with three different looks.
 *
 * Labels arrive translated: the component sits below the i18n namespaces and
 * would otherwise have to know all of them.
 */
export function ViewSwitcher<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: Props<T>) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className={className}
    >
      <TabsList aria-label={label}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className="gap-1.5">
            {option.icon}
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/**
 * View state that survives a reload.
 *
 * Reads on mount rather than during render — localStorage does not exist on
 * the server, and touching it while rendering would break hydration.
 */
export function usePersistedView<T extends string>(
  storageKey: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const [view, setView] = React.useState<T>(fallback);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && (allowed as readonly string[]).includes(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a client-only preference on mount, not derivable from render
      setView(stored as T);
    }
    // `allowed` is a literal array at every call site; re-running on identity
    // changes would reset the view on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const change = React.useCallback(
    (next: T) => {
      setView(next);
      window.localStorage.setItem(storageKey, next);
    },
    [storageKey],
  );

  return [view, change];
}
