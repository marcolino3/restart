"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { IconCalendar } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { membershipInitials, membershipName } from "../lib/membership-name";
import type { Task, TaskPriority } from "../types";

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

export function TaskCard({ task }: { task: Task }) {
  const t = useTranslations("Projects");

  return (
    <div className="rounded-md border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
            PRIORITY_CLASS[task.priority]
          )}
        >
          {t(`priority_${task.priority}`)}
        </span>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {task.dueDate ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconCalendar className="h-3.5 w-3.5" />
            {format(new Date(task.dueDate), "dd. MMM", { locale: de })}
          </span>
        ) : (
          <span />
        )}

        <div className="flex -space-x-2">
          {(task.assignees ?? []).slice(0, 4).map((a) => (
            <Tooltip key={a.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 border border-background">
                  <AvatarFallback className="text-[10px]">
                    {membershipInitials(a.membership)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{membershipName(a.membership)}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
