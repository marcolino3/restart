import type { useTranslations } from "next-intl";

type RolesTranslator = ReturnType<typeof useTranslations<"Roles">>;

export function roleDisplayName(
  t: RolesTranslator,
  role: { name: string | null; systemCode: string | null },
): string {
  if (role.systemCode && t.has(`systemRoleName.${role.systemCode}`)) {
    return t(`systemRoleName.${role.systemCode}` as const);
  }
  return role.name ?? "";
}
