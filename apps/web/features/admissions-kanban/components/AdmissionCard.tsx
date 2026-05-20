"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellRing, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { cn } from "@/lib/utils";
import type { KanbanApplication } from "../types";

interface Props {
  application: KanbanApplication;
  /** Vertical color strip (matches the column's stage colour). */
  stageColor?: string | null;
  dragging?: boolean;
  onOpen?: (id: string) => void;
  className?: string;
}

export function AdmissionCardVisual({
  application,
  stageColor,
  dragging,
  onOpen,
  className,
}: Props) {
  const t = useTranslations("Admissions");
  // `Date.now()` differs between SSR and client hydration — defer to a client-
  // only effect so the initial markup matches the server's null state.
  const [daysInStage, setDaysInStage] = useState<number | null>(null);
  useEffect(() => {
    setDaysInStage(
      Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(application.stageEnteredAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
    );
  }, [application.stageEnteredAt]);

  const familyLabel =
    application.family.name ?? `${t("family")} ${application.childLastName}`;
  const birthYear = application.childDateOfBirth
    ? application.childDateOfBirth.slice(0, 4)
    : null;

  return (
    <div
      className={cn(
        "group relative flex items-stretch overflow-hidden rounded-md border bg-card text-sm shadow-sm transition hover:shadow-md",
        dragging ? "opacity-90 shadow-lg" : "",
        onOpen && "cursor-pointer hover:bg-accent/40",
        className,
      )}
      role={onOpen ? "button" : undefined}
      onClick={onOpen ? () => onOpen(application.id) : undefined}
    >
      {/* Stage colour strip */}
      <span
        aria-hidden
        className="w-1 shrink-0"
        style={{ backgroundColor: stageColor ?? "var(--muted)" }}
      />

      <div className="flex flex-1 items-center gap-2 py-2 pl-2 pr-2">
        <StudentAvatar
          studentId={application.id}
          firstName={application.childFirstName}
          lastName={application.childLastName}
          className="h-8 w-8 shrink-0"
          fallbackClassName="text-[10px]"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">
            {application.childFirstName} {application.childLastName}
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
            {birthYear && (
              <span title={t("childDateOfBirth")}>{`Jg. ${birthYear}`}</span>
            )}
            {application.family.childrenCount > 1 && (
              <span
                className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 text-primary"
                title={familyLabel}
              >
                <Users2 className="h-2.5 w-2.5" />
                {application.family.childrenCount}
              </span>
            )}
            {application.openRemindersCount > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded px-1 font-medium",
                  application.overdueRemindersCount > 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/15 text-amber-700",
                )}
                title={`${application.openRemindersCount} offene Erinnerungen${
                  application.overdueRemindersCount > 0
                    ? `, ${application.overdueRemindersCount} überfällig`
                    : ""
                }`}
              >
                {application.overdueRemindersCount > 0 ? (
                  <BellRing className="h-2.5 w-2.5" />
                ) : (
                  <Bell className="h-2.5 w-2.5" />
                )}
                {application.openRemindersCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {daysInStage !== null && daysInStage > 0 && (
            <Badge
              variant={daysInStage > 14 ? "destructive" : "outline"}
              className="px-1.5 text-[10px] leading-none"
              title={t("daysShort", { count: daysInStage })}
            >
              {daysInStage}d
            </Badge>
          )}
          {application.desiredGradeLevelName && (
            <span
              aria-hidden={false}
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
              style={{
                backgroundColor:
                  application.desiredGradeLevelColor ?? "var(--muted)",
              }}
              title={application.desiredGradeLevelName}
              aria-label={application.desiredGradeLevelName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
