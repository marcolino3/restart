import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface EmployeeAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  /**
   * Real profile image. When absent, the design falls back to initials
   * (handoff `.ava`) — there is no employee photo upload yet, so this is
   * currently always initials.
   */
  imageUrl?: string | null;
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
 * Employee avatar: shows the profile image when one exists, otherwise the
 * initials in an accent circle (design handoff `.ava` — accent-soft
 * background, bold initials).
 */
export function EmployeeAvatar({
  firstName,
  lastName,
  imageUrl,
  className,
  fallbackClassName,
}: EmployeeAvatarProps) {
  return (
    <Avatar className={className}>
      {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
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
