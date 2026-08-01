import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";
import { cn } from "@/lib/utils";

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
