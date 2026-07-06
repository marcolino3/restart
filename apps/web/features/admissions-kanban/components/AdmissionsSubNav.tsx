"use client";

import { useTranslations } from "next-intl";
import { Kanban, Bell, Ban, Mail } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type TabKey = "kanban" | "reminders" | "rejected" | "templates";

interface Props {
  active: TabKey;
  reminderCount?: number;
  rejectedCount?: number;
  /** Layout override (e.g. `mb-0` when embedded above a toolbar row). */
  className?: string;
}

/**
 * Shared chip-row sub-navigation across the admission screens
 * (Kanban · Reminders · Rejected · Email templates), matching the design.
 */
export function AdmissionsSubNav({
  active,
  reminderCount,
  rejectedCount,
  className,
}: Props) {
  const t = useTranslations("Admissions");

  const tabs: Array<{
    key: TabKey;
    href: string;
    label: string;
    icon: typeof Kanban;
    count?: number;
  }> = [
    {
      key: "kanban",
      href: "/admin/admissions/kanban",
      label: t("subNavKanban"),
      icon: Kanban,
    },
    {
      key: "reminders",
      href: "/admin/admissions/reminders",
      label: t("remindersNavLabel"),
      icon: Bell,
      count: reminderCount,
    },
    {
      key: "rejected",
      href: "/admin/admissions/rejected",
      label: t("subNavRejected"),
      icon: Ban,
      count: rejectedCount,
    },
    {
      key: "templates",
      href: "/admin/admissions/email-templates",
      label: t("subNavTemplates"),
      icon: Mail,
    },
  ];

  const pathname = usePathname();

  return (
    <nav className={cn("mb-5 flex flex-wrap items-center gap-2", className)}>
      {tabs.map(({ key, href, label, icon: Icon, count }) => {
        const isActive = key === active || pathname === href;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {typeof count === "number" && count > 0 && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 text-[11px] font-semibold",
                  isActive
                    ? "bg-primary-foreground/20"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
