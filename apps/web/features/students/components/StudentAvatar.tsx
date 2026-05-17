import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StudentAvatarProps {
  studentId: string;
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

export function StudentAvatar({
  studentId,
  firstName,
  lastName,
  className,
  fallbackClassName,
}: StudentAvatarProps) {
  const src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(
    studentId,
  )}&backgroundType=gradientLinear`;

  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt="" />
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
