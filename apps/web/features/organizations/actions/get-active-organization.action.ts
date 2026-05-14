"use server";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrganizationByIdAction } from "./get-organization-by-id.action";

export const getActiveOrganizationAction = async () => {
  const userRes = await getCurrentUserAction();
  const orgId = userRes?.data?.orgId;
  if (!orgId) {
    return { success: false as const, error: "No active organization" };
  }
  return getOrganizationByIdAction(orgId);
};
