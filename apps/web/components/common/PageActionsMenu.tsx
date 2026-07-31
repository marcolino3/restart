"use client";

import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PageAction {
  /** Stable key, also used as the React key. */
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  /** Renders the entry in the destructive colour. */
  destructive?: boolean;
  disabled?: boolean;
  /** Draws a separator above this entry. */
  separatorBefore?: boolean;
}

interface PageActionsMenuProps {
  /**
   * Secondary actions, moved out of the page header into this overflow menu.
   * Entries are rendered in the given order — the caller decides what belongs
   * behind the "…" and what stays a primary button.
   */
  actions: PageAction[];
  align?: "start" | "end";
  className?: string;
}

/**
 * Overflow ("…") menu for a page's secondary actions, rendered as the
 * right-most control in a page header.
 *
 * Keeps list pages consistent: primary action stays a button, everything else
 * (CSV import, exports, bulk operations) moves in here instead of adding more
 * buttons next to the title.
 */
export function PageActionsMenu({
  actions,
  align = "end",
  className,
}: PageActionsMenuProps) {
  const t = useTranslations("Common");

  const visible = actions.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("openMenu")}
          className={className}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {visible.map((action) => (
          <React.Fragment key={action.id}>
            {action.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={action.disabled}
              className={
                action.destructive
                  ? "text-destructive focus:text-destructive"
                  : undefined
              }
              onSelect={(event) => {
                // Dialog-opening actions must not lose focus to the closing
                // menu, so suppress the default close-and-blur.
                event.preventDefault();
                action.onSelect();
              }}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
