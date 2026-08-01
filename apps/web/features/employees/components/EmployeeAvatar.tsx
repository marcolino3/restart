import { InitialsAvatar } from "@/components/common/InitialsAvatar";

interface EmployeeAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Employee avatar: always the initials in an accent circle (design handoff
 * `.ava` — accent-soft background, bold initials). Employees are represented by
 * initials only — no profile photo / generated image.
 */
export function EmployeeAvatar({
  firstName,
  lastName,
  className,
  fallbackClassName,
}: EmployeeAvatarProps) {
  return (
    <InitialsAvatar
      firstName={firstName}
      lastName={lastName}
      className={className}
      fallbackClassName={fallbackClassName}
    />
  );
}
