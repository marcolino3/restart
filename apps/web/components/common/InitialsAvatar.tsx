import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface InitialsAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  /** Optional image; falls back to initials when absent or it fails to load. */
  imageUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

/** Derive up to two uppercase initials from a first/last name, or "?" if neither is set. */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
) {
  return (
    (firstName?.charAt(0)?.toUpperCase() ?? "") +
      (lastName?.charAt(0)?.toUpperCase() ?? "") || "?"
  );
}

/**
 * Generic avatar: renders the given image when present, falling back to the
 * person's initials in an accent circle (design handoff `.ava`) when the
 * image is absent or fails to load.
 */
export function InitialsAvatar({
  firstName,
  lastName,
  imageUrl,
  className,
  fallbackClassName,
}: InitialsAvatarProps) {
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
