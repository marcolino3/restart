"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OrgFeatureKey } from "@restart/shared-schemas/org-features/feature-catalog";
import { updateOrganizationFeatureToggleAction } from "../actions/update-organization-feature-toggle.action";

interface FeatureToggle {
  featureKey: string;
  enabled: boolean;
}

interface OrganizationFeaturesTabProps {
  organizationId: string;
  toggles: FeatureToggle[];
}

export const OrganizationFeaturesTab = ({
  organizationId,
  toggles,
}: OrganizationFeaturesTabProps) => {
  const tO = useTranslations("Organizations");
  const [state, setState] = useState(toggles);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleToggle = (featureKey: string, enabled: boolean) => {
    setState((prev) =>
      prev.map((t) => (t.featureKey === featureKey ? { ...t, enabled } : t))
    );
    setPendingKey(featureKey);

    startTransition(async () => {
      const result = await updateOrganizationFeatureToggleAction({
        organizationId,
        featureKey,
        enabled,
      });
      setPendingKey(null);

      if (!result.success) {
        setState((prev) =>
          prev.map((t) =>
            t.featureKey === featureKey ? { ...t, enabled: !enabled } : t
          )
        );
        toast.error(tO("featureToggleUpdateError"));
        return;
      }

      toast.success(tO("featureToggleUpdateSuccess"));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tO("featuresTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.map((toggle) => (
          <div
            key={toggle.featureKey}
            className="flex items-center justify-between"
          >
            <Label htmlFor={`feature-${toggle.featureKey}`}>
              {tO(`feature.${toggle.featureKey}` as `feature.${OrgFeatureKey}`)}
            </Label>
            <Switch
              id={`feature-${toggle.featureKey}`}
              checked={toggle.enabled}
              disabled={pendingKey === toggle.featureKey}
              onCheckedChange={(checked) =>
                handleToggle(toggle.featureKey, checked)
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
