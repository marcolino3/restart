import React from "react";

import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";

const GradeLevelsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  await requireAdminPersona();
  return <>{children}</>;
};

export default GradeLevelsLayout;
