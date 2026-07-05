"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Persona } from "@restart/shared-types/graphql";
import {
  EmployeeOnboardingFormSchema,
  type EmployeeOnboardingFormType,
  type EmployeeOnboardingFormOutput,
} from "../../schemas/employee-onboarding-form.schema";
import {
  upsertEmployeeOnboardingDraftAction,
  finalizeEmployeeOnboardingAction,
} from "../../actions/employee-onboarding.actions";
import type { RadioCardOption } from "@/components/form/form-fields/RadioCardFormField";
import { StepPerson } from "./steps/StepPerson";
import { StepContract } from "./steps/StepContract";
import { StepRoles } from "./steps/StepRoles";
import { OnboardingSummaryAside } from "./OnboardingSummaryAside";

interface Props {
  orgCountry?: string | null;
  roleOptions: RadioCardOption[];
  teamOptions: { label: string; value: string }[];
}

type StepKey = "person" | "contract" | "roles";
const STEPS: StepKey[] = ["person", "contract", "roles"];

export function EmployeeOnboardingWizard({
  orgCountry,
  roleOptions,
  teamOptions,
}: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<EmployeeOnboardingFormType>({
    resolver: zodResolver(EmployeeOnboardingFormSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      persona: Persona.Employee,
      dateOfBirth: null,
      socialSecurityNumber: "",
      privateEmail: "",
      contactPhone: "",
      contactPhone2: "",
      street: "",
      houseNumber: "",
      addressLine2: "",
      postalCode: "",
      city: "",
      country: orgCountry ?? "",
      avatarUrl: "",
      timeTrackingEnabled: true,
      contractType: "",
      position: "",
      startDate: null,
      endDate: null,
      workloadPercent: undefined,
      weeklyHours: "",
      annualVacationDays: undefined,
      weekdayTimeWindows: {},
      documentUrl: "",
      teamId: undefined,
      roleId: undefined,
      language: locale === "en" ? "en" : "de",
      invitationTiming: "IMMEDIATE",
    },
  });

  /** Persist the current form values as a draft (create or patch). */
  const saveDraft = useCallback(async (): Promise<string | undefined> => {
    const values = form.getValues() as EmployeeOnboardingFormOutput;
    setSaveState("saving");
    const res = await upsertEmployeeOnboardingDraftAction(values);
    if (res.success) {
      if (!draftId) {
        setDraftId(res.data.id);
        form.setValue("id", res.data.id);
      }
      setSaveState("saved");
      return res.data.id;
    }
    setSaveState("idle");
    const msg = typeof res.error === "string" ? res.error : "";
    toast.error(
      /already exists|already in use|conflict/i.test(msg)
        ? t("emailInUse")
        : t("saveError"),
    );
    return undefined;
  }, [form, draftId, t]);

  // Debounced auto-save once a draft exists (design: "Entwurf wird
  // automatisch gespeichert"). Subscribes to any field change.
  useEffect(() => {
    if (!draftId) return;
    const sub = form.watch(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void saveDraft();
      }, 1500);
    });
    return () => {
      sub.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draftId, form, saveDraft]);

  const goNext = async () => {
    // Per-step validation before advancing.
    if (step === 0) {
      const ok = await form.trigger(["firstName", "lastName", "email"]);
      if (!ok || !form.getValues("email")) {
        toast.error(t("personIncomplete"));
        return;
      }
      const id = await saveDraft();
      if (!id) return;
    } else if (step === 1) {
      if (!form.getValues("startDate")) {
        form.setError("startDate", { message: t("entryDateRequired") });
        toast.error(t("entryDateRequired"));
        return;
      }
      await saveDraft();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onFinalize = async () => {
    if (!form.getValues("roleId")) {
      toast.error(t("roleRequired"));
      return;
    }
    setSubmitting(true);
    const id = draftId ?? (await saveDraft());
    if (!id) {
      setSubmitting(false);
      return;
    }
    await saveDraft();
    const res = await finalizeEmployeeOnboardingAction({
      id,
      invitationTiming: form.getValues("invitationTiming") ?? "IMMEDIATE",
    });
    setSubmitting(false);
    if (res.success) {
      toast.success(t("employeeCreated"));
      router.push(ROUTES.admin.employees(locale));
    } else {
      toast.error(t("finalizeError"));
    }
  };

  /** Persist the current state as a draft and return to the list. */
  const saveDraftAndExit = async () => {
    const ok = await form.trigger(["firstName", "lastName", "email"]);
    if (!ok || !form.getValues("email")) {
      toast.error(t("personIncomplete"));
      return;
    }
    const id = await saveDraft();
    if (id) {
      toast.success(t("draftSaved"));
      router.push(ROUTES.admin.employees(locale));
    }
  };

  // The finalize CTA reflects the chosen invitation timing.
  const invitationTiming = form.watch("invitationTiming");
  const finalizeCtaLabel =
    invitationTiming === "MANUAL"
      ? t("createNoInvite")
      : invitationTiming === "ON_ENTRY_DATE"
        ? t("createAndSchedule")
        : t("createAndInvite");

  return (
    <Form {...form}>
      <div className="flex flex-col gap-5">
        {/* Step indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((key, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={key}
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active && "border-primary bg-accent text-accent-foreground",
                  done && "border-primary/40 text-foreground",
                  !active && !done && "border-border text-muted-foreground",
                )}
              >
                {done && <Check className="h-3.5 w-3.5 text-primary" />}
                {t(`step_${key}`)}
              </button>
            );
          })}
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            {saveState === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("saving")}
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check className="h-3 w-3 text-primary" />
                {t("draftSaved")}
              </>
            )}
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div>
            {step === 0 && (
              <StepPerson orgCountry={orgCountry} draftId={draftId} />
            )}
            {step === 1 && (
              <StepContract teamOptions={teamOptions} draftId={draftId} />
            )}
            {step === 2 && <StepRoles roleOptions={roleOptions} />}
          </div>
          <OnboardingSummaryAside
            roleOptions={roleOptions}
            teamOptions={teamOptions}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={saveDraftAndExit}
            disabled={submitting}
          >
            {t("saveDraftClose")}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                step === 0
                  ? router.push(ROUTES.admin.employees(locale))
                  : setStep((s) => Math.max(s - 1, 0))
              }
            >
              {step === 0 ? t("cancel") : t("back")}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                {t("next")}
              </Button>
            ) : (
              <Button type="button" onClick={onFinalize} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {finalizeCtaLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Form>
  );
}
