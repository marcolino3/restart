import React from "react";

import { requireAdminRole } from "@/features/users/guards/require-admin-role";

const CurriculaLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  await requireAdminRole();
  return <>{children}</>;
};

export default CurriculaLayout;
