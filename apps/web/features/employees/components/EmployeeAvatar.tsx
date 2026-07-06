import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface EmployeeAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
  fallbackClassName?: string;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  return (
    (firstName?.charAt(0)?.toUpperCase() ?? "") +
      (lastName?.charAt(0)?.toUpperCase() ?? "") || "?"
  );
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
    <Avatar className={className}>
      <AvatarFallback
        className={cn(
          "bg-accent font-bold text-accent-foreground",
          fallbackClassName,
        )}
      >
        {getInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
