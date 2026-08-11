"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{tO("featuresTitle")}</CardTitle>
        <Badge variant="secondary">
          {tO("featuresActiveCount", {
            enabled: enabledCount,
            total: ORG_FEATURE_KEYS.length,
          })}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bulkPending}
            onClick={handleBulkCore}
          >
            {tO("featureBulkCore")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bulkPending}
            onClick={handleBulkAll}
          >
            {tO("featureBulkAll")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bulkPending}
            onClick={handleBulkNoBeta}
          >
            {tO("featureBulkNoBeta")}
          </Button>
        </div>

        {SECTIONS.map((section) => {
          const keys = ORG_FEATURE_KEYS.filter(
            (key) => FEATURE_CATALOG[key].section === section
          );
          const sectionEnabled = keys.filter((key) => state[key]).length;

          return (
            <div key={section} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  {tO(`featureSection_${section}`)}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {sectionEnabled} / {keys.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {keys.map((key) => {
                  const entry = FEATURE_CATALOG[key];
                  const enabled = !!state[key];
                  const parentDisabled =
                    entry.dependsOn != null && !state[entry.dependsOn];
                  const isPending = pendingKey === key;

                  return (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`feature-${key}`} className="font-medium">
                            {tO(`feature.${key}` as `feature.${OrgFeatureKey}`)}
                          </Label>
                          {entry.beta && (
                            <Badge variant="sky">{tO("featureBetaBadge")}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tO(
                            `featureDescription.${key}` as `featureDescription.${OrgFeatureKey}`
                          )}
                        </p>
                        {parentDisabled && (
                          <Badge variant="amber">
                            {tO("featureRequiresParent", {
                              parent: tO(
                                `feature.${entry.dependsOn}` as `feature.${OrgFeatureKey}`
                              ),
                            })}
                          </Badge>
                        )}
                      </div>
                      <Switch
                        id={`feature-${key}`}
                        checked={enabled}
                        disabled={isPending || parentDisabled}
                        onCheckedChange={(checked) => handleToggle(key, checked)}
                      />
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
