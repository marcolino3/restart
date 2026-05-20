import React from "react";

import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";

const TeamsLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAdminPersona();
  return <>{children}</>;
};

export default TeamsLayout;
