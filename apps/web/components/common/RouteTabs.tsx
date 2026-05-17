"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export type RouteTab = {
  key: string;
  label: string;
  href: string;
  /**
   * Optional custom matcher. If omitted, the tab whose `href` is the longest
   * prefix of the current pathname wins — this handles nested routes
   * automatically (e.g. `/foo/bar` activates the `/foo/bar` tab rather than
   * the `/foo` tab).
   */
  match?: (pathname: string) => boolean;
};

interface Props {
  tabs: RouteTab[];
  /** Forwarded to the `<nav aria-label>` for screen readers. */
  ariaLabel?: string;
  className?: string;
  /**
   * Search-param keys to forward when navigating between tabs (e.g.
   * `["classId"]`). Without this, `<Link>` would drop the current query
   * string and persisted UI state (active class, etc.) would reset on
   * every tab click.
   */
  preserveSearchParams?: string[];
}

function pickActiveTab(
  pathname: string,
  tabs: RouteTab[],
): RouteTab | undefined {
  for (const t of tabs) {
    if (t.match && t.match(pathname)) return t;
  }
  let best: RouteTab | undefined;
  for (const t of tabs) {
    if (t.match) continue;
    if (pathname === t.href || pathname.startsWith(`${t.href}/`)) {
      if (!best || t.href.length > best.href.length) best = t;
    }
  }
  return best;
}

/**
 * Route-aware tabs that look like the shadcn `<Tabs>` component but each
 * trigger is a `<Link>` instead of an in-page state toggle. Use this when
 * you want pill-style tabs that drive page navigation (different URLs)
 * rather than tab state within a single page.
 */
export function RouteTabs({
  tabs,
  ariaLabel,
  className,
  preserveSearchParams,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pickActiveTab(pathname, tabs);

  const preservedQs = (() => {
    if (!preserveSearchParams || preserveSearchParams.length === 0) return "";
    const out = new URLSearchParams();
    for (const key of preserveSearchParams) {
      const value = searchParams.get(key);
      if (value !== null) out.set(key, value);
    }
    const s = out.toString();
    return s ? `?${s}` : "";
  })();

  return (
    <nav
      aria-label={ariaLabel}
      role="tablist"
      className={cn(
        "inline-flex h-10 w-fit items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = active?.key === tab.key;
        return (
          <Link
            key={tab.key}
            href={`${tab.href}${preservedQs}`}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive && "bg-background text-foreground shadow-xs",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
