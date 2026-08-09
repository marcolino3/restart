import React from "react";

import { requireAdminRole } from "@/features/users/guards/require-admin-role";

const RolesLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAdminRole();
  return <>{children}</>;
};

export default RolesLayout;
