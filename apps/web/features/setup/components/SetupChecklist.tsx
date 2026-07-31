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

/**
 * All copy is passed in rather than translated here. The step labels live
 * under dynamic keys (`steps.<KEY>.title`), which next-intl cannot check at
 * build time — resolving them inside this component made one missing key take
 * down the whole dashboard. The caller resolves them explicitly instead.
 */
export interface SetupLabels {
  title: string;
  titleComplete: string;
  subtitle: string;
  subtitleComplete: string;
  progressLabel: string;
  optional: string;
  open: string;
  showAll: string;
  /** Per step: title and description, keyed by SetupStepKey. */
  steps: Record<SetupStepKey, { title: string; description: string }>;
  /** Pre-formatted, because plural rules belong to the translation layer. */
  countLabels: Partial<Record<SetupStepKey, string>>;
}

interface Props {
  status: SetupStatus;
  locale: string;
  labels: SetupLabels;
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
export function SetupChecklist({
  status,
  locale,
  labels,
  variant = "compact",
}: Props) {
  if (status.complete && variant === "compact") return null;

  const requiredSteps = status.steps.filter((s) => s.required);
  const requiredDone = requiredSteps.filter((s) => s.done).length;

  // Compact mode leads with what is still open; the full page lists everything.
  const visible =
    variant === "compact"
      ? status.steps.filter((s) => !s.done).slice(0, 4)
      : status.steps;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {status.complete ? labels.titleComplete : labels.title}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {status.complete ? labels.subtitleComplete : labels.subtitle}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SetupProgress
          done={requiredDone}
          total={requiredSteps.length}
          label={labels.progressLabel}
        />

        <div className="flex flex-col gap-2">
          {visible.map((step) => {
            const position =
              status.steps.findIndex((s) => s.key === step.key) + 1;
            const copy = labels.steps[step.key];
            // A key we have no copy for is skipped rather than rendered blank.
            if (!copy) return null;
            return (
              <SetupStepCard
                key={step.key}
                index={position}
                title={copy.title}
                description={copy.description}
                href={`/${locale}${STEP_ROUTES[step.key]}`}
                done={step.done}
                required={step.required}
                countLabel={labels.countLabels[step.key]}
                optionalLabel={labels.optional}
                actionLabel={labels.open}
              />
            );
          })}
        </div>

        {variant === "compact" && status.requiredRemaining > visible.length && (
          <a
            href={`/${locale}/admin/setup`}
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
          >
            {labels.showAll}
          </a>
        )}
      </CardContent>
    </Card>
  );
}
