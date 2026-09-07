"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { ROUTES } from "@/constants/routes";

/**
 * Invalidates the employees list after a change made outside a server action
 * (e.g. the CSV/Excel import that posts to the REST endpoint from the client).
 * `router.refresh()` alone does not drop the cached RSC payload of the page.
 */
export const revalidateEmployeesAction = async () => {
  const locale = await getLocale();
  revalidatePath(ROUTES.admin.employees(locale));
};
