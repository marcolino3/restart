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
import type { EmployeeFunctionItem } from "@/features/employee-functions/types";
import { mapEmployeeFunctionsToOptions } from "@/features/employee-functions/lib/map-employee-functions-to-options";
import { StepPerson } from "./steps/StepPerson";
import { StepContract } from "./steps/StepContract";
import { StepRoles } from "./steps/StepRoles";
import { OnboardingSummaryAside } from "./OnboardingSummaryAside";

interface Props {
  orgCountry?: string | null;
  roleOptions: RadioCardOption[];
  teamOptions: { label: string; value: string }[];
  employeeFunctions: EmployeeFunctionItem[];
  initialValues?: EmployeeOnboardingFormType;
  /** ACTIVE = existing employee edit (save only); DRAFT = resume onboarding wizard. */
  employeeStatus?: "DRAFT" | "ACTIVE";
}

type StepKey = "person" | "contract" | "roles";
const STEPS: StepKey[] = ["person", "contract", "roles"];

export function EmployeeOnboardingWizard({
  orgCountry,
  roleOptions,
  teamOptions,
  employeeFunctions,
  initialValues,
  employeeStatus,
}: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const locale = useLocale();
  const router = useRouter();
  const isActiveEdit = employeeStatus === "ACTIVE" && Boolean(initialValues?.id);
  const functionOptions = mapEmployeeFunctionsToOptions(
    employeeFunctions,
    locale,
  );

  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(
    initialValues?.id,
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<EmployeeOnboardingFormType>({
    resolver: zodResolver(EmployeeOnboardingFormSchema),
    defaultValues: initialValues ?? {
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
      probationEndDate: null,
      workloadPercent: undefined,
      weeklyHours: "",
      annualVacationDays: undefined,
      grossSalary: undefined,
      hourlyRate: undefined,
      paymentInterval: "",
      has13thSalary: false,
      weekdayTimeWindows: {},
      weekdayWorkloads: {},
      documentUrl: "",
      teamId: undefined,
      roleId: undefined,
      language: locale === "en" ? "en" : "de",
      invitationTiming: "IMMEDIATE",
    },
  });

  const savedValuesRef = useRef(initialValues ? JSON.stringify(initialValues) : "");
  const savedFieldsRef = useRef<Record<string, unknown>>(initialValues ?? {});
  const savingRef = useRef<Promise<string | undefined> | null>(null);
  const navigationRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    setReady(true);
    return () => { mountedRef.current = false; };
  }, []);

  /** One in-flight save, then persist any edits made while it was pending. */
  const saveDraft = useCallback((): Promise<string | undefined> => {
    if (savingRef.current) return savingRef.current;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const run = async () => {
      setSaveState("saving");
      try {
        while (mountedRef.current) {
          const values = structuredClone(form.getValues()) as EmployeeOnboardingFormOutput;
          const changedFields = Object.keys(values).filter((key) =>
            JSON.stringify(values[key as keyof typeof values]) !== JSON.stringify(savedFieldsRef.current[key]),
          );
          const res = await upsertEmployeeOnboardingDraftAction(values, changedFields);
          if (!mountedRef.current) return undefined;
          if (!res.success) {
            if (res.fieldErrors) {
              for (const [field, messages] of Object.entries(res.fieldErrors)) {
                if (messages?.[0]) form.setError(field as keyof EmployeeOnboardingFormType, { message: messages[0] });
              }
            }
            toast.error(t("saveError"));
            return undefined;
          }
          values.id = res.data.id;
          values.version = res.data.version;
          savedFieldsRef.current = values;
          savedValuesRef.current = JSON.stringify(values);
          setDraftId(res.data.id);
          form.setValue("version", res.data.version);
          if (form.getValues("id") !== res.data.id) form.setValue("id", res.data.id);
          if (JSON.stringify(form.getValues()) === savedValuesRef.current) {
            setSaveState("saved");
            return res.data.id;
          }
        }
        return undefined;
      } catch {
        if (mountedRef.current) toast.error(t("saveError"));
        return undefined;
      } finally {
        savingRef.current = null;
        if (mountedRef.current) setSaveState((state) => state === "saving" ? "idle" : state);
      }
    };
    savingRef.current = run();
    return savingRef.current;
  }, [form, t]);

  useEffect(() => {
    const sub = form.watch(() => setSaveState((state) => state === "saving" ? state : "idle"));
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(form.getValues()) !== savedValuesRef.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener("beforeunload", warn);
    return () => { sub.unsubscribe(); window.removeEventListener("beforeunload", warn); };
  }, [form]);

  // Debounced auto-save once a draft exists (design: "Entwurf wird
  // automatisch gespeichert"). Active-employee edits save only on explicit
  // submit — auto-save would otherwise create a contract version per keystroke.
  useEffect(() => {
    if (!draftId || isActiveEdit) return;
    const sub = form.watch((_values, { name }) => {
      if (name === "id" || name === "version" || JSON.stringify(form.getValues()) === savedValuesRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void saveDraft();
      }, 1500);
    });
    return () => {
      sub.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draftId, form, saveDraft, isActiveEdit]);

  const goNext = async () => {
    // Per-step validation before advancing.
    if (savingRef.current || submitting) return;
    if (step === 0) {
      const ok = await form.trigger(["title", "firstName", "lastName", "email", "privateEmail", "dateOfBirth", "socialSecurityNumber", "contactPhone", "contactPhone2", "street", "houseNumber", "addressLine2", "postalCode", "city", "country", "avatarUrl", "language"]);
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
      if (!(await saveDraft())) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onFinalize = async () => {
    if (submitting || savingRef.current) return;
    if (!isActiveEdit && !form.getValues("roleId")) {
      toast.error(t("roleRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const id = await saveDraft();
      if (!id) return;
      if (isActiveEdit) {
        toast.success(t("employeeUpdated"));
        router.push(ROUTES.admin.employeesView(locale, id));
        return;
      }
      const res = await finalizeEmployeeOnboardingAction({
        id,
        invitationTiming: form.getValues("invitationTiming") ?? "IMMEDIATE",
        expectedVersion: form.getValues("version")!,
      });
      if (!mountedRef.current) return;
      if (res.success) {
        toast.success(t("employeeCreated"));
        router.push(ROUTES.admin.employees(locale));
      } else toast.error(t("finalizeError"));
    } catch {
      if (mountedRef.current) toast.error(t("finalizeError"));
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  /** Persist the current state as a draft and return to the list. */
  const saveDraftAndExit = async () => {
    if (savingRef.current || submitting || navigationRef.current) return;
    navigationRef.current = true;
    try {
    const ok = await form.trigger(["firstName", "lastName", "email", "privateEmail"]);
    if (!ok || !form.getValues("email")) {
      toast.error(t("personIncomplete"));
      return;
    }
    const id = await saveDraft();
    if (id) {
      toast.success(isActiveEdit ? t("employeeUpdated") : t("draftSaved"));
      router.push(
        isActiveEdit
          ? ROUTES.admin.employeesView(locale, id)
          : ROUTES.admin.employees(locale),
      );
    }
    } finally { navigationRef.current = false; }
  };

  // The finalize CTA reflects the chosen invitation timing (create/draft only).
  const invitationTiming = form.watch("invitationTiming");
  const finalizeCtaLabel = isActiveEdit
    ? t("saveChanges")
    : invitationTiming === "MANUAL"
      ? t("createNoInvite")
      : invitationTiming === "ON_ENTRY_DATE"
        ? t("createAndSchedule")
        : t("createAndInvite");

  return (
    <Form {...form}>
      <fieldset disabled={!ready} className="min-w-0">
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
                disabled={submitting || saveState === "saving"}
                onClick={() => { if (i > step) void goNext(); else setStep(i); }}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active && "border-primary bg-accent text-accent-foreground",
                  done && "border-primary/40 text-foreground",
                  !active && !done && "border-border text-muted-foreground",
                  !active &&
                    "cursor-pointer hover:border-primary/50 hover:bg-accent/40",
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
              <StepContract
                teamOptions={teamOptions}
                functionOptions={functionOptions}
                draftId={draftId}
              />
            )}
            {step === 2 && (
              <StepRoles
                roleOptions={roleOptions}
                showInvitationTiming={!isActiveEdit}
              />
            )}
          </div>
          <OnboardingSummaryAside
            roleOptions={roleOptions}
            teamOptions={teamOptions}
            employeeFunctions={employeeFunctions}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={saveDraftAndExit}
            disabled={submitting || saveState === "saving"}
          >
            {t(isActiveEdit ? "saveAndClose" : "saveDraftClose")}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                step === 0
                  ? (JSON.stringify(form.getValues()) === savedValuesRef.current || window.confirm(locale === 'en' ? 'Discard unsaved changes?' : 'Ungespeicherte Änderungen verwerfen?')) && router.push(ROUTES.admin.employees(locale))
                  : setStep((s) => Math.max(s - 1, 0))
              }
            >
              {step === 0 ? t("cancel") : t("back")}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} disabled={submitting || saveState === "saving"}>
                {t("next")}
              </Button>
            ) : (
              <Button type="button" onClick={onFinalize} disabled={submitting || saveState === "saving"}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {finalizeCtaLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
      </fieldset>
    </Form>
  );
}
