"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SelectFormFieldWithoutTranslations } from "@/components/form/form-fields/SelectFormFieldWithoutTranslations";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";

import { createApplicationAction } from "../actions/create-application.action";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
import type { KanbanStage } from "../types";

const Schema = z.object({
  childFirstName: z.string().min(1).max(120),
  childLastName: z.string().min(1).max(120),
  childGender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  childDateOfBirth: z.date().nullable().optional(),
  admissionStageId: z.string().optional(),
  desiredGradeLevelId: z.string().optional(),
  desiredEnrollmentDate: z.date().nullable().optional(),
  source: z
    .enum(["MANUAL", "PUBLIC_FORM", "OPEN_DAY", "REFERRAL", "OTHER"])
    .optional(),
  childNotes: z.string().max(2000).optional(),
  familyId: z.string().optional(),
  familyName: z.string().max(200).optional(),
  parentFirstName: z.string().max(120).optional(),
  parentLastName: z.string().max(120).optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z.string().max(64).optional(),
  parentRole: z
    .enum(["MOTHER", "FATHER", "LEGAL_GUARDIAN", "OTHER"])
    .optional(),
});

type FormValues = z.infer<typeof Schema>;

interface ExistingFamily {
  id: string;
  name: string;
  contactNames: string[];
}

/** Minimal grade-level shape needed for the "desired grade" select. */
export interface GradeLevelOption {
  id: string;
  name: string;
  shortCode?: string | null;
}

interface Props {
  stages: KanbanStage[];
  /** Org grade levels for the "desired grade" select; empty ⇒ field hidden. */
  gradeLevels?: GradeLevelOption[];
  existingFamilies: ExistingFamily[];
  onClose: () => void;
  onCreated: () => void;
  /** Preselected stage when opened from a column's "+ Hinzufügen" button. */
  initialStageId?: string | null;
}

export function CreateApplicationDialog({
  stages,
  gradeLevels: gradeLevelsProp,
  existingFamilies,
  onClose,
  onCreated,
  initialStageId,
}: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();
  const [familySearch, setFamilySearch] = useState("");

  // Grade levels power the "desired grade" select. Callers may pass them in;
  // otherwise fetch them once via the org-scoped server action so the dialog is
  // self-contained and doesn't require the parent to plumb the data through.
  const [gradeLevels, setGradeLevels] = useState<GradeLevelOption[]>(
    gradeLevelsProp ?? [],
  );
  useEffect(() => {
    if (gradeLevelsProp && gradeLevelsProp.length > 0) {
      setGradeLevels(gradeLevelsProp);
      return;
    }
    let active = true;
    void getGradeLevelsAction().then((res) => {
      if (!active || !res.success) return;
      setGradeLevels(
        res.data.map((g) => ({
          id: g.id,
          name: g.name,
          shortCode: g.shortCode,
        })),
      );
    });
    return () => {
      active = false;
    };
  }, [gradeLevelsProp]);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      childFirstName: "",
      childLastName: "",
      admissionStageId:
        (initialStageId && stages.some((s) => s.id === initialStageId)
          ? initialStageId
          : stages[0]?.id) ?? stages[0]?.id,
      source: "MANUAL",
      parentRole: "MOTHER",
    },
  });

  const dedupedFamilies = useMemo(() => {
    const seen = new Set<string>();
    const out: ExistingFamily[] = [];
    for (const f of existingFamilies) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      out.push(f);
    }
    return out;
  }, [existingFamilies]);

  const familyMatches = useMemo(() => {
    const q = familySearch.trim().toLowerCase();
    if (!q) return dedupedFamilies.slice(0, 5);
    return dedupedFamilies
      .filter((f) => {
        const hay = [f.name, ...f.contactNames].join(" ").toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 5);
  }, [dedupedFamilies, familySearch]);

  const onSubmit = async (values: FormValues) => {
    const dob = values.childDateOfBirth
      ? values.childDateOfBirth.toISOString().split("T")[0]
      : undefined;
    const enrollmentDate = values.desiredEnrollmentDate
      ? values.desiredEnrollmentDate.toISOString().split("T")[0]
      : undefined;

    const contactPersons =
      values.parentFirstName || values.parentLastName
        ? [
            {
              firstName: values.parentFirstName ?? "",
              lastName: values.parentLastName ?? "",
              email: values.parentEmail || undefined,
              phone: values.parentPhone || undefined,
              roles: values.parentRole ? [values.parentRole] : undefined,
            },
          ]
        : undefined;

    const res = await createApplicationAction({
      childFirstName: values.childFirstName,
      childLastName: values.childLastName,
      childGender: values.childGender ?? undefined,
      childDateOfBirth: dob,
      childNotes: values.childNotes || undefined,
      admissionStageId: values.admissionStageId || undefined,
      desiredGradeLevelId: values.desiredGradeLevelId || undefined,
      desiredEnrollmentDate: enrollmentDate,
      source: values.source ?? "MANUAL",
      familyId: values.familyId || undefined,
      familyName:
        !values.familyId && values.familyName ? values.familyName : undefined,
      contactPersons,
    });
    if (res.success) {
      toast.success(t("createSuccess"));
      form.reset();
      onCreated();
      router.refresh();
    } else {
      toast.error(t("createError"), { description: res.error });
    }
  };

  const stageOptions = stages.map((s) => ({
    value: s.id,
    label: s.name,
  }));
  const gradeLevelOptions = gradeLevels.map((g) => ({
    value: g.id,
    label: g.shortCode ? `${g.name} (${g.shortCode})` : g.name,
  }));
  // Option-labels for SelectFormField are i18n keys translated against the
  // configured namespace (Admissions). Hence "genderMale" rather than t("genderMale").
  const genderOptions = [
    { value: "MALE", label: "genderMale" },
    { value: "FEMALE", label: "genderFemale" },
    { value: "OTHER", label: "genderOther" },
  ];
  const sourceOptions = [
    { value: "MANUAL", label: "sourceManual" },
    { value: "PUBLIC_FORM", label: "sourcePublicForm" },
    { value: "OPEN_DAY", label: "sourceOpenDay" },
    { value: "REFERRAL", label: "sourceReferral" },
    { value: "OTHER", label: "sourceOther" },
  ];
  const parentRoleOptions = [
    { value: "MOTHER", label: "roleMother" },
    { value: "FATHER", label: "roleFather" },
    { value: "LEGAL_GUARDIAN", label: "roleLegalGuardian" },
    { value: "OTHER", label: "roleOther" },
  ];

  const selectedFamilyId = form.watch("familyId");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[800px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{t("newApplication")}</DialogTitle>
          <DialogDescription>{t("newApplicationHint")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogBody className="space-y-5">
              {/* Kind — two-column form rows (design `.frow`). */}
              <div className="space-y-3.5">
                <h3 className="text-[13px] font-semibold">
                  {t("childSection")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InputFormField
                    name="childFirstName"
                    label="childFirstName"
                    namespace="Admissions"
                  />
                  <InputFormField
                    name="childLastName"
                    label="childLastName"
                    namespace="Admissions"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectFormField
                    name="childGender"
                    label="childGender"
                    options={genderOptions}
                    namespace="Admissions"
                  />
                  <DatePickerFormField
                    name="childDateOfBirth"
                    label="childDateOfBirth"
                    namespace="Admissions"
                  />
                </div>
                <TextareaFormField
                  name="childNotes"
                  label="childNotes"
                  namespace="Admissions"
                />
              </div>

              {/* Stage · Quelle · Stufe — two columns, self-labeled selects. */}
              <div className="grid grid-cols-2 gap-3">
                <SelectFormFieldWithoutTranslations
                  name="admissionStageId"
                  label={t("initialStage")}
                  options={stageOptions}
                />
                <SelectFormField
                  name="source"
                  label="source"
                  options={sourceOptions}
                  namespace="Admissions"
                />
                <DatePickerFormField
                  name="desiredEnrollmentDate"
                  label="desiredEntry"
                  namespace="Admissions"
                />
                {gradeLevelOptions.length > 0 && (
                  <SelectFormFieldWithoutTranslations
                    name="desiredGradeLevelId"
                    label={t("desiredGradeLevel")}
                    options={gradeLevelOptions}
                  />
                )}
              </div>

              {/* Familie */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-[13px] font-semibold">
                    {t("familySection")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("familySectionHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder={t("familySearchPlaceholder")}
                    value={familySearch}
                    onChange={(e) => setFamilySearch(e.target.value)}
                  />
                  {familyMatches.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {familyMatches.map((f) => {
                        const selected = selectedFamilyId === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() =>
                              form.setValue(
                                "familyId",
                                selected ? undefined : f.id,
                              )
                            }
                            className={`rounded-ctl border px-2 py-1 text-xs ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "bg-card hover:bg-accent"
                            }`}
                          >
                            {f.name}
                            {f.contactNames.length > 0 && (
                              <span className="ml-1 opacity-70">
                                ({f.contactNames[0]})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {!selectedFamilyId && (
                  <InputFormField
                    name="familyName"
                    label="familyNameOptional"
                    namespace="Admissions"
                  />
                )}
              </div>

              {/* Bezugsperson — two-column rows. */}
              <div className="space-y-3.5">
                <div>
                  <h3 className="text-[13px] font-semibold">
                    {t("parentSection")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("parentSectionHint")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputFormField
                    name="parentFirstName"
                    label="parentFirstName"
                    namespace="Admissions"
                  />
                  <InputFormField
                    name="parentLastName"
                    label="parentLastName"
                    namespace="Admissions"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputFormField
                    name="parentEmail"
                    label="parentEmail"
                    type="email"
                    namespace="Admissions"
                  />
                  <InputFormField
                    name="parentPhone"
                    label="parentPhone"
                    namespace="Admissions"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectFormField
                    name="parentRole"
                    label="parentRole"
                    options={parentRoleOptions}
                    namespace="Admissions"
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {tC("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {t("createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
