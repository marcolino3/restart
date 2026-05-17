"use client";

import { useLocale } from "next-intl";

import { cn } from "@/lib/utils";

// Loose ancestor shape — accepts both the GraphQL payload (string locale)
// and the strongly-typed `LessonAncestor` from types.ts (enum locale).
// Breadcrumb rendering doesn't care which is used.
type AncestorLike = {
  id: string;
  nodeType: "AREA" | "TOPIC" | "GROUP" | "LESSON";
  translations: { locale: string; name: string }[];
};

interface Props {
  ancestors: AncestorLike[] | null | undefined;
  /** Show TOPIC on narrow viewports. Default: hide on small. */
  showTopicOnMobile?: boolean;
  className?: string;
}

const ORDER: AncestorLike["nodeType"][] = ["AREA", "TOPIC", "GROUP"];

const pickName = (
  translations: { locale: string; name: string }[] | undefined,
  locale: string,
): string => {
  if (!translations || translations.length === 0) return "—";
  const normalized = locale.toUpperCase();
  return (
    translations.find((t) => t.locale === normalized)?.name ??
    translations[0]?.name ??
    "—"
  );
};

/**
 * Compact AREA › TOPIC › GROUP path. Hides TOPIC on small viewports
 * (most usable real-estate for AREA + immediate parent), reveals it on
 * `md+`. Pass `showTopicOnMobile` to force-display.
 *
 * Resilient to missing ancestors — only renders levels that exist.
 */
export function LessonBreadcrumb({
  ancestors,
  showTopicOnMobile = false,
  className,
}: Props) {
  const locale = useLocale();
  if (!ancestors || ancestors.length === 0) return null;

  // ancestors come ordered from nearest-parent up to AREA. Build a map.
  const byType = new Map<AncestorLike["nodeType"], AncestorLike>();
  for (const a of ancestors) byType.set(a.nodeType, a);

  const parts = ORDER.flatMap((type) => {
    const node = byType.get(type);
    if (!node) return [];
    return [{ type, name: pickName(node.translations, locale) }];
  });
  if (parts.length === 0) return null;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground",
        className,
      )}
    >
      {parts.map((p, i) => {
        const isTopic = p.type === "TOPIC";
        return (
          <span
            key={`${p.type}-${i}`}
            className={cn(
              "inline-flex items-center gap-1",
              isTopic && !showTopicOnMobile && "hidden md:inline-flex",
            )}
          >
            {i > 0 && (
              <span aria-hidden="true" className="text-muted-foreground/60">
                ›
              </span>
            )}
            <span className="truncate max-w-[14rem]">{p.name}</span>
          </span>
        );
      })}
    </p>
  );
}
