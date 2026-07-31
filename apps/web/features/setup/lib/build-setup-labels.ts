import { getTranslations } from "next-intl/server";

import type {
  SetupStatus,
  SetupStepKey,
} from "../actions/get-setup-status.action";
import type { SetupLabels } from "../components/SetupChecklist";

const STEP_KEYS: SetupStepKey[] = [
  "ORGANIZATION",
  "GRADE_LEVELS",
  "SCHOOL_CLASSES",
  "EMPLOYEES",
  "CURRICULUM",
  "CURRICULUM_CYCLE_LINK",
  "STUDENTS",
  "EMAIL",
  "TIME_TRACKING",
];

/**
 * Resolves every string the checklist needs, up front and defensively.
 *
 * The step labels sit under dynamic keys (`steps.<KEY>.title`), which
 * next-intl cannot verify at build time — a single missing one would
 * otherwise throw while rendering and take the dashboard with it. Here a
 * missing key degrades to the raw key instead.
 */
export async function buildSetupLabels(
  status: SetupStatus,
): Promise<SetupLabels> {
  const t = await getTranslations("Setup");

  const safe = (key: string, fallback: string) => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };

  const steps = {} as SetupLabels["steps"];
  for (const key of STEP_KEYS) {
    steps[key] = {
      title: safe(`steps.${key}.title`, key),
      description: safe(`steps.${key}.description`, ""),
    };
  }

  const countLabels: SetupLabels["countLabels"] = {};
  for (const step of status.steps) {
    if (step.key === "ORGANIZATION" || step.key === "EMAIL") continue;
    if (step.key === "CURRICULUM_CYCLE_LINK") {
      if (!step.done) {
        try {
          countLabels[step.key] = t("stagesWithoutCycle", {
            count: step.count,
          });
        } catch {
          // no label is better than a broken page
        }
      }
      continue;
    }
    if (step.done) {
      try {
        countLabels[step.key] = t("recordCount", { count: step.count });
      } catch {
        // same
      }
    }
  }

  return {
    title: safe("title", "Setup"),
    titleComplete: safe("titleComplete", "Setup"),
    subtitle: safe("subtitle", ""),
    subtitleComplete: safe("subtitleComplete", ""),
    progressLabel: safe("progressLabel", ""),
    optional: safe("optional", "optional"),
    open: safe("open", "→"),
    showAll: safe("showAll", ""),
    steps,
    countLabels,
  };
}
