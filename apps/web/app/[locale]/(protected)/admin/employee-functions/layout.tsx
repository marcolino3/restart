import { requireAdminRole } from "@/features/users/guards/require-admin-role";

export default async function EmployeeFunctionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminRole();
  return children;
}
