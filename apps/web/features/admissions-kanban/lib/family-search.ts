/** A family candidate for the create-application family search. */
export interface FamilySearchItem {
  id: string;
  name: string;
  contactNames: string[];
}

/** De-duplicates families by id, keeping first occurrence. */
export function dedupeFamilies<T extends { id: string }>(families: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const f of families) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
  }
  return out;
}

/**
 * Filters families for the create dialog's family search: an empty query
 * returns the first `limit` families; otherwise families whose name OR any
 * contact name contains the (case-insensitive) query. Result is capped at
 * `limit`. Input is de-duplicated by id first.
 */
export function filterFamilies<T extends FamilySearchItem>(
  families: T[],
  query: string,
  limit = 5,
): T[] {
  const deduped = dedupeFamilies(families);
  const q = query.trim().toLowerCase();
  if (!q) return deduped.slice(0, limit);
  return deduped
    .filter((f) => {
      const hay = [f.name, ...f.contactNames].join(" ").toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}
