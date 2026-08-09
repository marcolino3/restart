import React from "react";

import { requireAdminRole } from "@/features/users/guards/require-admin-role";

const GradeLevelsLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  await requireAdminRole();
  return <>{children}</>;
};

export default GradeLevelsLayout;
