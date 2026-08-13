import {
  BuildingIcon,
  ShieldIcon,
  Users2Icon,
  BriefcaseIcon,
  SchoolIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  FolderKanbanIcon,
  LockKeyholeIcon,
  MapPinIcon,
  type LucideProps,
} from "lucide-react";

import type { CategoryKey } from "../permission-catalog";

const CATEGORY_ICONS: Record<CategoryKey, typeof ShieldIcon> = {
  organization: BuildingIcon,
  userManagement: ShieldIcon,
  teams: Users2Icon,
  employees: BriefcaseIcon,
  teacher: SchoolIcon,
  admissions: ClipboardListIcon,
  students: GraduationCapIcon,
  projects: FolderKanbanIcon,
  dataProtection: LockKeyholeIcon,
  general: MapPinIcon,
};

type CategoryIconProps = LucideProps & { category: CategoryKey };

export function CategoryIcon({ category, ...props }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[category] ?? ShieldIcon;
  return <Icon {...props} />;
}
