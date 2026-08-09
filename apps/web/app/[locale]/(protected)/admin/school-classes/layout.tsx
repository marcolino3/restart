import React from "react";

import { requireAdminRole } from "@/features/users/guards/require-admin-role";

const SchoolClassesLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  await requireAdminRole();
  return <>{children}</>;
};

export default SchoolClassesLayout;
