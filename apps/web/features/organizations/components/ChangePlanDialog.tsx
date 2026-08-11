"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BillingInterval,
  OrgPlan,
} from "@restart/shared-schemas/organizations/organization-enums";
import { changeOrganizationPlanAction } from "../actions/change-organization-plan.action";

interface ChangePlanDialogProps {
  organizationId: string;
  currentPlan: string;
  currentUserLicenseLimit?: number | null;
  currentContractEndsAt?: string | null;
  currentBillingInterval?: string | null;
  currentBillingAmountChf?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ChangePlanDialog = ({
  organizationId,
  currentPlan,
  currentUserLicenseLimit,
  currentContractEndsAt,
  currentBillingInterval,
  currentBillingAmountChf,
  open,
  onOpenChange,
  onSuccess,
}: ChangePlanDialogProps) => {
  const tO = useTranslations("Organizations");
  const t = useTranslations("Common");
  const [plan, setPlan] = useState(currentPlan);
  const [userLicenseLimit, setUserLicenseLimit] = useState(
    currentUserLicenseLimit?.toString() ?? ""
  );
  const [contractEndsAt, setContractEndsAt] = useState(
    currentContractEndsAt ?? ""
  );
  const [billingInterval, setBillingInterval] = useState(
    currentBillingInterval ?? BillingInterval.YEARLY
  );
  const [billingAmountChf, setBillingAmountChf] = useState(
    currentBillingAmountChf?.toString() ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await changeOrganizationPlanAction({
      id: organizationId,
      plan,
      userLicenseLimit: userLicenseLimit ? Number(userLicenseLimit) : undefined,
      contractEndsAt: contractEndsAt || undefined,
      billingInterval,
      billingAmountChf: billingAmountChf ? Number(billingAmountChf) : undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(tO("changePlanSuccess"));
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(tO("changePlanError"), { description: result.error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tO("changePlanDialogTitle")}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{tO("sidebarPlan")}</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrgPlan).map((value) => (
                  <SelectItem key={value} value={value}>
                    {tO(`plan_${value}` as `plan_${OrgPlan}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userLicenseLimit">{tO("sidebarUserLicenses")}</Label>
            <Input
              id="userLicenseLimit"
              type="number"
              min={1}
              value={userLicenseLimit}
              onChange={(e) => setUserLicenseLimit(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractEndsAt">{tO("sidebarContractEndsAt")}</Label>
            <Input
              id="contractEndsAt"
              type="date"
              value={contractEndsAt}
              onChange={(e) => setContractEndsAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{tO("billingInterval")}</Label>
            <Select value={billingInterval} onValueChange={setBillingInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BillingInterval).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingAmountChf">{tO("sidebarBilling")} (CHF)</Label>
            <Input
              id="billingAmountChf"
              type="number"
              min={0}
              step="0.01"
              value={billingAmountChf}
              onChange={(e) => setBillingAmountChf(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tO("sidebarChangePlan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
