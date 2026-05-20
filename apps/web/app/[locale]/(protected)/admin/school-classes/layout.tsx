import React from "react";

import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";

const SchoolClassesLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  await requireAdminPersona();
  return <>{children}</>;
};

export default SchoolClassesLayout;
