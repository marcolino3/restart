/**
 * Sortiert Einträge nach ihrer Position innerhalb des Abrechnungsjahrs, das am
 * Stichtag (MM-DD) beginnt: Monat/Tag ab dem Stichtag zuerst, alles davor ans
 * Ende. Innerhalb desselben Monat/Tags entscheidet das volle Datum.
 */
export function sortByPeriodAnchor<T>(
  items: T[],
  anchor: { month: number; day: number },
  getDate: (item: T) => string,
): T[] {
  const anchorKey = anchor.month * 100 + anchor.day;

  const offset = (isoDate: string): number => {
    const [, mm, dd] = isoDate.split('-').map((s) => parseInt(s, 10));
    const key = mm * 100 + dd;
    // 1300 > jeder mögliche MM-DD-Key, hält die Reihenfolge vor dem Stichtag intakt.
    return key >= anchorKey ? key : key + 1300;
  };

  return [...items].sort((a, b) => {
    const dateA = getDate(a);
    const dateB = getDate(b);
    const diff = offset(dateA) - offset(dateB);
    return diff !== 0 ? diff : dateA.localeCompare(dateB);
  });
}
