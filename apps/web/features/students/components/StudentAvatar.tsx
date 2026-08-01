import { InitialsAvatar } from "@/components/common/InitialsAvatar";

interface StudentAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  /** Student photo, if one is on file; falls back to initials otherwise. */
  photoUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Student avatar: shows the student's photo when available, otherwise falls
 * back to their initials in an accent circle.
 */
export function StudentAvatar({
  firstName,
  lastName,
  photoUrl,
  className,
  fallbackClassName,
}: StudentAvatarProps) {
  return (
    <InitialsAvatar
      firstName={firstName}
      lastName={lastName}
      imageUrl={photoUrl}
      className={className}
      fallbackClassName={fallbackClassName}
    />
  );
}
