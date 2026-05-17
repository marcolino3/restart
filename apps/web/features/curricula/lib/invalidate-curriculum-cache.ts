"use server";

import { updateTag } from "next/cache";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { curriculumOrgTag } from "./cache-tags";

/**
 * Invalidiert den gesamten Curriculum-Cache der aktiven Org. Wird nach
 * jeder Curriculum-Mutation (Create/Update/Archive/Translate/Reorder
 * etc.) aufgerufen.
 *
 * Wir nutzen bewusst den breiten Org-Tag und nicht granular pro
 * (curriculumId, levelId), weil Curriculum-Aenderungen selten sind und
 * der Org-weite Drop einen ganzen Klassen-Trade-off (alle Felder
 * frisch) garantiert. Ein einzelner Translation-Wechsel kann sonst in
 * verschachtelten Lesson-Pickern stale bleiben.
 */
export const invalidateCurriculumCache = async (): Promise<void> => {
  const userRes = await getCurrentUserAction();
  const orgId = userRes?.data?.orgId;
  if (orgId) {
    updateTag(curriculumOrgTag(orgId));
  }
};
