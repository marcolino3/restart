import { requireAdminPersona } from "@/features/users/guards/require-admin-persona";

export default async function EmployeeFunctionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPersona();
  return children;
}
