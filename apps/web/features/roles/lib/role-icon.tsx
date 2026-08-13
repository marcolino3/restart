import {
  ClipboardListIcon,
  CrownIcon,
  ShieldIcon,
  UserCogIcon,
  Users2Icon,
  UsersIcon,
  type LucideProps,
} from "lucide-react";

const SYSTEM_ROLE_ICONS: Record<string, typeof ShieldIcon> = {
  ORG_OWNER: CrownIcon,
  ORG_ADMIN: ShieldIcon,
  HR_MANAGER: UsersIcon,
  OFFICE: ClipboardListIcon,
  TEAM_LEAD: UserCogIcon,
  EMPLOYEE: Users2Icon,
};

type RoleIconProps = LucideProps & { systemCode: string | null };

export function RoleIcon({ systemCode, ...props }: RoleIconProps) {
  const Icon = (systemCode && SYSTEM_ROLE_ICONS[systemCode]) || ShieldIcon;
  return <Icon {...props} />;
}
