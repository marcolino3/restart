"use client";

import { useTranslations } from "next-intl";

import { InitialsAvatar } from "@/components/common/InitialsAvatar";
import { cn } from "@/lib/utils";

export interface AvatarGroupPerson {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
}

interface AvatarGroupProps {
  people: AvatarGroupPerson[];
  /** Max avatars rendered before collapsing into the "+N" count. */
  max?: number;
  className?: string;
}

/**
 * Overlapping avatar stack for a small group of people, with a trailing
 * "N children" label — matches the "Kinder" column in the Fortschritte
 * design handoff. A single person renders their full name instead of a
 * count, since "1 Kind" reads worse than the name itself.
 */
export function AvatarGroup({ people, max = 3, className }: AvatarGroupProps) {
  const t = useTranslations("Common");
  const visible = people.slice(0, max);

  if (people.length === 0) return null;

  if (people.length === 1) {
    const [person] = people;
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <InitialsAvatar
          firstName={person.firstName}
          lastName={person.lastName}
          imageUrl={person.imageUrl}
          className="size-6 text-[10px]"
        />
        <span className="text-sm">
          {person.firstName} {person.lastName}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex -space-x-2">
        {visible.map((person) => (
          <InitialsAvatar
            key={person.id}
            firstName={person.firstName}
            lastName={person.lastName}
            imageUrl={person.imageUrl}
            className="size-6 border-2 border-card text-[10px]"
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {t("childrenCount", { count: people.length })}
      </span>
    </div>
  );
}
