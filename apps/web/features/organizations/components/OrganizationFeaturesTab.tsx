"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BarChart3,
  BookOpen,
  CalendarOff,
  CheckSquare,
  Clock,
  FileText,
  Heart,
  Kanban,
  ListTodo,
  MessageSquare,
  School,
  Smile,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FEATURE_CATALOG,
  ORG_FEATURE_KEYS,
  OrgFeatureKey,
  OrgFeatureSection,
} from "@restart/shared-schemas/org-features/feature-catalog";
import { updateOrganizationFeatureToggleAction } from "../actions/update-organization-feature-toggle.action";
import { bulkUpdateOrganizationFeatureTogglesAction } from "../actions/bulk-update-organization-feature-toggles.action";

interface FeatureToggle {
  featureKey: string;
  enabled: boolean;
}

interface OrganizationFeaturesTabProps {
  organizationId: string;
  toggles: FeatureToggle[];
}

const SECTIONS: OrgFeatureSection[] = [
  "CORE",
  "PEDAGOGY",
  "ADMISSIONS",
  "COLLABORATION",
];

const FEATURE_ICONS: Record<OrgFeatureKey, LucideIcon> = {
  [OrgFeatureKey.TIME_TRACKING]: Clock,
  [OrgFeatureKey.TIME_REPORTS]: BarChart3,
  [OrgFeatureKey.ABSENCES]: CalendarOff,
  [OrgFeatureKey.EMPLOYEES]: Users,
  [OrgFeatureKey.CLASSES]: School,
  [OrgFeatureKey.CURRICULA]: BookOpen,
  [OrgFeatureKey.PROGRESS]: CheckSquare,
  [OrgFeatureKey.LEARNING_REPORTS]: FileText,
  [OrgFeatureKey.ADMISSIONS]: ListTodo,
  [OrgFeatureKey.CONTACT_PERSONS]: Heart,
  [OrgFeatureKey.PARENT_PORTAL]: Smile,
  [OrgFeatureKey.PROJECTS]: Kanban,
  [OrgFeatureKey.MY_TASKS]: ListTodo,
  [OrgFeatureKey.CHATS]: MessageSquare,
  [OrgFeatureKey.PROTOCOLS]: FileText,
};

export const OrganizationFeaturesTab = ({
  organizationId,
  toggles,
}: OrganizationFeaturesTabProps) => {
  const tO = useTranslations("Organizations");
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(toggles.map((t) => [t.featureKey, t.enabled]))
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [, startTransition] = useTransition();

  const enabledCount = useMemo(
    () => Object.values(state).filter(Boolean).length,
    [state]
  );

  const childOf = useMemo(() => {
    const map: Partial<Record<OrgFeatureKey, OrgFeatureKey>> = {};
    for (const key of ORG_FEATURE_KEYS) {
      const dep = FEATURE_CATALOG[key].dependsOn;
      if (dep) map[dep] = key;
    }
    return map;
  }, []);

  const handleToggle = (featureKey: string, enabled: boolean) => {
    const previous = { ...state };
    // Disabling a parent must also disable its dependents locally so the
    // lock-state renders immediately, mirroring the server-side cascade.
    const next = { ...state, [featureKey]: enabled };
    if (!enabled) {
      for (const key of ORG_FEATURE_KEYS) {
        if (FEATURE_CATALOG[key].dependsOn === featureKey) {
          next[key] = false;
        }
      }
    }
    setState(next);
    setPendingKey(featureKey);

    startTransition(async () => {
      const result = await updateOrganizationFeatureToggleAction({
        organizationId,
        featureKey,
        enabled,
      });
      setPendingKey(null);

      if (!result.success) {
        setState(previous);
        toast.error(tO("featureToggleUpdateError"));
        return;
      }

      const updated = Object.fromEntries(
        result.data.map((t) => [t.featureKey, t.enabled])
      );
      setState((prev) => ({ ...prev, ...updated }));
      toast.success(tO("featureToggleUpdateSuccess"));
    });
  };

  const applyBulk = (updates: { featureKey: string; enabled: boolean }[]) => {
    const previous = { ...state };
    const next = { ...state };
    for (const u of updates) next[u.featureKey] = u.enabled;
    setState(next);
    setBulkPending(true);

    startTransition(async () => {
      const result = await bulkUpdateOrganizationFeatureTogglesAction({
        organizationId,
        updates,
      });
      setBulkPending(false);

      if (!result.success) {
        setState(previous);
        toast.error(tO("featureBulkUpdateError"));
        return;
      }

      const updated = Object.fromEntries(
        result.data.map((t) => [t.featureKey, t.enabled])
      );
      setState((prev) => ({ ...prev, ...updated }));
      toast.success(tO("featureBulkUpdateSuccess"));
    });
  };

  const handleBulkCore = () => {
    applyBulk(
      ORG_FEATURE_KEYS.map((key) => ({
        featureKey: key,
        enabled: FEATURE_CATALOG[key].section === "CORE",
      }))
    );
  };

  const handleBulkAll = () => {
    applyBulk(ORG_FEATURE_KEYS.map((key) => ({ featureKey: key, enabled: true })));
  };

  const handleBulkNoBeta = () => {
    applyBulk(
      ORG_FEATURE_KEYS.map((key) => ({
        featureKey: key,
        enabled: !FEATURE_CATALOG[key].beta,
      }))
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-[9px]">
          {tO("featuresTitle")}
          <span className="ml-auto inline-flex items-center rounded-full bg-accent px-[9px] py-[2px] font-mono text-[11px] font-semibold leading-none text-accent-foreground">
            {tO("featuresActiveCount", {
              enabled: enabledCount,
              total: ORG_FEATURE_KEYS.length,
            })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="mb-[14px] text-[12.5px] text-muted-foreground">
          {tO("featuresHint")}
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-muted-foreground">
            {tO("featureBulkLabel")}
          </span>
          <button
            type="button"
            disabled={bulkPending}
            onClick={handleBulkCore}
            className="h-[30px] rounded-full border px-[13px] text-[12px] font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            {tO("featureBulkCore")}
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={handleBulkAll}
            className="h-[30px] rounded-full border px-[13px] text-[12px] font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            {tO("featureBulkAll")}
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={handleBulkNoBeta}
            className="h-[30px] rounded-full border px-[13px] text-[12px] font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            {tO("featureBulkNoBeta")}
          </button>
        </div>

        {SECTIONS.map((section, sectionIdx) => {
          const keys = ORG_FEATURE_KEYS.filter(
            (key) => FEATURE_CATALOG[key].section === section
          );

          return (
            <div key={section}>
              <div
                className={cn(
                  "mb-[10px] text-[11.5px] font-[650] uppercase tracking-[0.06em] text-muted-foreground",
                  sectionIdx === 0 ? "mt-[6px]" : "mt-5"
                )}
              >
                {tO(`featureSection_${section}`)}
              </div>
              <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                {keys.map((key) => {
                  const entry = FEATURE_CATALOG[key];
                  const Icon = FEATURE_ICONS[key];
                  const enabled = !!state[key];
                  const parentDisabled =
                    entry.dependsOn != null && !state[entry.dependsOn];
                  const isPending = pendingKey === key;
                  const child = childOf[key];

                  let metaText: string;
                  if (entry.dependsOn) {
                    metaText = tO("featureRequiresParent", {
                      parent: tO(
                        `feature.${entry.dependsOn}` as `feature.${OrgFeatureKey}`
                      ),
                    });
                  } else if (child) {
                    metaText = tO("featureBasisFor", {
                      child: tO(`feature.${child}` as `feature.${OrgFeatureKey}`),
                    });
                  } else {
                    metaText = tO("featureUnlockedForAllRoles");
                  }

                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex flex-col gap-[7px] rounded-lg border px-[14px] py-[13px] transition-colors",
                        enabled && "border-[color-mix(in_oklab,var(--acc)_32%,var(--line))] bg-[color-mix(in_oklab,var(--acc)_4%,var(--panel))]",
                        parentDisabled && "bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-[10px]">
                        <span
                          className={cn(
                            "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground",
                            enabled && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Icon className="h-[15px] w-[15px]" />
                        </span>
                        <span
                          className={cn(
                            "flex-1 truncate text-[13.5px] font-semibold",
                            parentDisabled && "text-muted-foreground"
                          )}
                        >
                          {tO(`feature.${key}` as `feature.${OrgFeatureKey}`)}
                        </span>
                        {entry.beta && (
                          <Badge variant="amber" className="text-[10px]">
                            {tO("featureBetaBadge")}
                          </Badge>
                        )}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={tO(
                            `feature.${key}` as `feature.${OrgFeatureKey}`
                          )}
                          disabled={isPending || parentDisabled}
                          onClick={() => handleToggle(key, !enabled)}
                          className={cn(
                            "relative h-6 w-[42px] shrink-0 rounded-full bg-[color-mix(in_oklab,var(--ink)_18%,var(--field))] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                            enabled && "bg-primary"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform",
                              enabled && "translate-x-[18px]"
                            )}
                          />
                        </button>
                      </div>
                      <p
                        className={cn(
                          "text-[12px] leading-[1.45] text-muted-foreground",
                          parentDisabled && "text-muted-foreground"
                        )}
                      >
                        {tO(
                          `featureDescription.${key}` as `featureDescription.${OrgFeatureKey}`
                        )}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-[3px] text-[11.5px] text-muted-foreground">
                        {metaText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
