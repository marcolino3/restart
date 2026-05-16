import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href: string;
  label: string;
  className?: string;
}

/**
 * Konsistenter "Zurück"-Button im Header von Detail-/Edit-Seiten.
 * Folgt dem Curricula-Pattern (ghost, sm, ChevronLeft + Label).
 */
export const BackButton = ({ href, label, className }: BackButtonProps) => (
  <Button
    variant="ghost"
    size="sm"
    asChild
    className={cn("-ml-2 w-fit", className)}
  >
    <Link href={href}>
      <ChevronLeft className="mr-1 h-4 w-4" />
      {label}
    </Link>
  </Button>
);
