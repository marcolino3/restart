import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";
import { cn } from "@/lib/utils";

interface StudentAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  /**
   * Profile photo of the child. Students have no image field yet, so this is
   * usually undefined and the initials fallback is what renders.
   */
  imageUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function StudentAvatar({
  firstName,
  lastName,
  imageUrl,
  className,
  fallbackClassName,
}: StudentAvatarProps) {
  return (
    <Avatar className={className}>
      {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
      <AvatarFallback
        className={cn(
          "bg-primary text-primary-foreground font-semibold",
          fallbackClassName,
        )}
      >
        {getInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
