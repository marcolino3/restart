import { getTranslations } from "next-intl/server";

import {
  SetupProgress,
  SetupStepCard,
} from "@/components/ui/setup-step-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SetupStatus, SetupStepKey } from "../actions/get-setup-status.action";

/** Where each step sends the admin. Locale is prefixed by the caller. */
const STEP_ROUTES: Record<SetupStepKey, string> = {
  ORGANIZATION: "/admin/organization",
  GRADE_LEVELS: "/admin/grade-levels",
  SCHOOL_CLASSES: "/admin/school-classes",
  EMPLOYEES: "/admin/employees",
  CURRICULUM: "/admin/curricula",
  CURRICULUM_CYCLE_LINK: "/admin/grade-levels",
  STUDENTS: "/admin/students",
  EMAIL: "/admin/settings",
  TIME_TRACKING: "/admin/time-tracking-settings",
};

interface Props {
  status: SetupStatus;
  locale: string;
  /** Compact renders the dashboard panel; full is the /admin/setup page. */
  variant?: "compact" | "full";
}

/**
 * Progress of the initial setup. A fresh organisation starts with roles and
 * admission stages seeded but nothing else, so the dashboard would otherwise
 * show four empty stat cards and no hint of what to do.
 *
 * Renders nothing once every required step is done — the panel should not
 * linger on a configured org.
 */
export async function SetupChecklist({
  status,
  locale,
  variant = "compact",
}: Props) {
  const t = await getTranslations("Setup");

  if (status.complete && variant === "compact") return null;

  const requiredSteps = status.steps.filter((s) => s.required);
  const requiredDone = requiredSteps.filter((s) => s.done).length;

  // Compact mode leads with what is still open; the full page lists everything.
  const visible =
    variant === "compact"
      ? [...status.steps.filter((s) => !s.done)].slice(0, 4)
      : status.steps;

  const countLabel = (key: SetupStepKey, count: number, done: boolean) => {
    if (key === "CURRICULUM_CYCLE_LINK") {
      return done ? undefined : t("stagesWithoutCycle", { count });
    }
    if (key === "ORGANIZATION" || key === "EMAIL") return undefined;
    return done ? t("recordCount", { count }) : undefined;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {status.complete ? t("titleComplete") : t("title")}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {status.complete ? t("subtitleComplete") : t("subtitle")}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SetupProgress
          done={requiredDone}
          total={requiredSteps.length}
          label={t("progressLabel")}
        />

        <div className="flex flex-col gap-2">
          {visible.map((step) => {
            const position =
              status.steps.findIndex((s) => s.key === step.key) + 1;
            return (
              <SetupStepCard
                key={step.key}
                index={position}
                title={t(`steps.${step.key}.title`)}
                description={t(`steps.${step.key}.description`)}
                href={`/${locale}${STEP_ROUTES[step.key]}`}
                done={step.done}
                required={step.required}
                countLabel={countLabel(step.key, step.count, step.done)}
                optionalLabel={t("optional")}
                actionLabel={t("open")}
              />
            );
          })}
        </div>

        {variant === "compact" && status.requiredRemaining > visible.length && (
          <a
            href={`/${locale}/admin/setup`}
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
          >
            {t("showAll")}
          </a>
        )}
      </CardContent>
    </Card>
  );
}
