/**
 * Cache-Tags fuer Curriculum-Daten (Curricula, Levels, Nodes).
 *
 * Curricula aendern sich selten, werden aber oft gelesen (RecordKeeping,
 * Heatmap, Schueler-Profile, Lesson-Pickers). Wir cachen alle Reads via
 * `unstable_cache` und invalidieren ueber `updateTag(...)` bei jeder
 * Curriculum-Mutation.
 *
 * Tag-Strategie:
 * - `curriculumOrgTag(orgId)` deckt JEDE Curriculum-Cache-Entry der Org ab
 *   und wird von allen Mutations invalidiert. Multi-Tenant-sicher, weil
 *   pro Org separat.
 * - Granulare Tags (curriculumByIdTag etc.) erlauben spaeter gezieltere
 *   Invalidierung, ohne den ganzen Org-Cache zu droppen, wenn eine
 *   Mutation die spezifische ID kennt.
 */

export const curriculumOrgTag = (organizationId: string) =>
  `curriculum-org:${organizationId}`;

export const curriculumListTag = (organizationId: string) =>
  `curriculum-list:${organizationId}`;

export const curriculumByIdTag = (curriculumId: string) =>
  `curriculum-by-id:${curriculumId}`;

export const curriculumLevelsTag = (curriculumId: string) =>
  `curriculum-levels:${curriculumId}`;

export const curriculumNodesTag = (curriculumId: string, levelId: string) =>
  `curriculum-nodes:${curriculumId}:${levelId}`;
