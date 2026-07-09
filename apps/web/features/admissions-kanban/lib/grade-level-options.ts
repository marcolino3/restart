import type { GradeLevelOption } from "../components/CreateApplicationDialog";

/** Prefix used to visually indent a subgroup (Untergruppe) under its Stufe. */
export const GRADE_LEVEL_SUBGROUP_PREFIX = "↳ "; // "↳ "

/** Formats a single grade level's display label (name + optional short code). */
const gradeLevelLabel = (g: GradeLevelOption): string =>
  g.shortCode ? `${g.name} (${g.shortCode})` : g.name;

/**
 * Builds the flat option list for the "Zugeteilte Stufe" select from the org's
 * grade levels, preserving the one-level hierarchy: each top-level Stufe
 * (`parentId == null`) is followed immediately by its Untergruppen
 * (`parentId === stufe.id`), which are indented with a "↳ " prefix.
 *
 * Stufen are sorted by `sortOrder`; each Stufe's subgroups are likewise sorted
 * by `sortOrder` among themselves. A Stufe without subgroups renders as a plain
 * (unindented) option, so the flat case is unchanged.
 *
 * The option `value` is always the node's own id — either a Stufe or an
 * Untergruppe is selectable (the deepest node the user picks).
 *
 * `SelectFormField` is flat-only (no optgroup support), hence the prefix-based
 * indentation rather than real option groups.
 */
export function buildGradeLevelOptions(
  gradeLevels: GradeLevelOption[],
): { value: string; label: string }[] {
  const bySortOrder = (a: GradeLevelOption, b: GradeLevelOption): number =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  const topLevel = gradeLevels
    .filter((g) => g.parentId == null)
    .sort(bySortOrder);

  const childrenByParent = new Map<string, GradeLevelOption[]>();
  for (const g of gradeLevels) {
    if (g.parentId == null) continue;
    const list = childrenByParent.get(g.parentId) ?? [];
    list.push(g);
    childrenByParent.set(g.parentId, list);
  }

  const options: { value: string; label: string }[] = [];
  for (const stufe of topLevel) {
    options.push({ value: stufe.id, label: gradeLevelLabel(stufe) });
    const children = (childrenByParent.get(stufe.id) ?? []).sort(bySortOrder);
    for (const child of children) {
      options.push({
        value: child.id,
        label: `${GRADE_LEVEL_SUBGROUP_PREFIX}${gradeLevelLabel(child)}`,
      });
    }
  }
  return options;
}
