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
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";

import { createApplicationAction } from "../actions/create-application.action";
import { getGradeLevelsAction } from "@/features/grade-levels/actions/get-grade-levels.action";
import { buildGradeLevelOptions } from "../lib/grade-level-options";
import { filterFamilies } from "../lib/family-search";
import type { AdmissionSource, KanbanStage } from "../types";
import type { SchoolClassOption } from "./EditApplicationDetailsDialog";
import {
  ContactPersonsFieldArray,
  ContactSchema,
  EMPTY_CONTACT,
  NONE,
  contactRowFilled,
  refineContacts,
} from "./ContactPersonsFieldArray";

const Schema = z
  .object({
    childFirstName: z.string().min(1).max(120),
    childLastName: z.string().min(1).max(120),
    childGender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    childDateOfBirth: z.date().nullable().optional(),
    admissionStageId: z.string().optional(),
    assignedGradeLevelId: z.string().optional(),
    desiredSchoolClassId: z.string().optional(),
    desiredEnrollmentDate: z.date().nullable().optional(),
    admissionSourceId: z.string().uuid().nullable().optional(),
    childNotes: z.string().max(2000).optional(),
    familyId: z.string().optional(),
    familyName: z.string().max(200).optional(),
    contacts: z.array(ContactSchema),
  })
  .superRefine((values, ctx) => refineContacts(values.contacts, ctx));

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
  /** `null` ⇒ top-level Stufe; otherwise the id of its parent Stufe. */
  parentId?: string | null;
  /** Ordering within its level (Stufen among Stufen, subgroups among siblings). */
  sortOrder?: number;
}

interface Props {
  stages: KanbanStage[];
  /** Org grade levels for the "desired grade" select; empty ⇒ field hidden. */
  gradeLevels?: GradeLevelOption[];
  /** Active org school classes for the "desired class" select; empty ⇒ field hidden. */
  schoolClasses?: SchoolClassOption[];
  /** Org intake channels ("Eingangskanäle") for the source select. */
  sources?: AdmissionSource[];
  existingFamilies: ExistingFamily[];
  onClose: () => void;
  onCreated: () => void;
  /** Preselected stage when opened from a column's "+ Hinzufügen" button. */
  initialStageId?: string | null;
  /** Preselected family when registering a sibling from a detail page. */
  initialFamilyId?: string | null;
}

/** Small uppercase section label — same look as the edit dialog. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-0">
      {children}
    </p>
  );
}

export function CreateApplicationDialog({
  stages,
  gradeLevels: gradeLevelsProp,
  schoolClasses = [],
  sources = [],
  existingFamilies,
  onClose,
  onCreated,
  initialStageId,
  initialFamilyId,
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
          parentId: g.parentId,
          sortOrder: g.sortOrder,
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
      familyId: initialFamilyId ?? undefined,
      admissionSourceId:
        sources.find((s) => !s.isArchived)?.id ?? sources[0]?.id ?? null,
      // One open contact card to start with (role MOTHER); more can be added.
      contacts: [{ ...EMPTY_CONTACT }],
    },
  });

  const familyMatches = useMemo(
    () => filterFamilies(existingFamilies, familySearch),
    [existingFamilies, familySearch],
  );

  const onSubmit = async (values: FormValues) => {
    const dob = values.childDateOfBirth
      ? values.childDateOfBirth.toISOString().split("T")[0]
      : undefined;
    const enrollmentDate = values.desiredEnrollmentDate
      ? values.desiredEnrollmentDate.toISOString().split("T")[0]
      : undefined;

    // Contact persons: list order = priority; completely empty rows are
    // skipped. Everything is created in one go via createApplicationAction —
    // there are no existing persons to update/archive in the create dialog.
    const contactRows = values.contacts.filter(contactRowFilled);
    const contactPersons =
      contactRows.length > 0
        ? contactRows.map((c) => ({
            firstName: c.firstName.trim(),
            lastName: c.lastName.trim(),
            email: c.email.trim() || undefined,
            phone: c.phone.trim() || undefined,
            mobile: c.mobile.trim() || undefined,
            roles: c.role && c.role !== NONE ? [c.role] : undefined,
          }))
        : undefined;

    const res = await createApplicationAction({
      childFirstName: values.childFirstName,
      childLastName: values.childLastName,
      childGender: values.childGender ?? undefined,
      childDateOfBirth: dob,
      childNotes: values.childNotes || undefined,
      admissionStageId: values.admissionStageId || undefined,
      assignedGradeLevelId: values.assignedGradeLevelId || undefined,
      desiredSchoolClassId:
        values.desiredSchoolClassId && values.desiredSchoolClassId !== NONE
          ? values.desiredSchoolClassId
          : undefined,
      desiredEnrollmentDate: enrollmentDate,
      admissionSourceId: values.admissionSourceId ?? undefined,
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
  const gradeLevelOptions = buildGradeLevelOptions(gradeLevels);
  const noneOption = { value: NONE, label: t("noneOption") };
  const schoolClassOptions = [
    noneOption,
    ...schoolClasses.map((c) => ({ value: c.id, label: c.name })),
  ];
  // Option-labels for SelectFormField are i18n keys translated against the
  // configured namespace (Admissions). Hence "genderMale" rather than t("genderMale").
  const genderOptions = [
    { value: "MALE", label: "genderMale" },
    { value: "FEMALE", label: "genderFemale" },
    { value: "OTHER", label: "genderOther" },
  ];
  // Intake channels come from the org-configured list (literal names, not i18n).
  const sourceOptions = sources
    .filter((s) => !s.isArchived)
    .map((s) => ({ value: s.id, label: s.name }));
  // Pre-translated role labels (translateOptions=false) — same as the edit dialog.
  const roleOptions = [
    noneOption,
    { value: "MOTHER", label: t("roleMother") },
    { value: "FATHER", label: t("roleFather") },
    { value: "LEGAL_GUARDIAN", label: t("roleLegalGuardian") },
    { value: "OTHER", label: t("roleOther") },
  ];

  const selectedFamilyId = form.watch("familyId");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[900px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{t("newApplication")}</DialogTitle>
          <DialogDescription>{t("newApplicationHint")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogBody>
              {/* Two columns on wide screens: left = child + application +
                  family, right = contact persons. Stacks on narrow screens. */}
              <div className="grid gap-x-6 gap-y-3.5 lg:grid-cols-2">
                {/* Left column */}
                <div className="space-y-3.5">
                  <SectionLabel>{t("sectionChild")}</SectionLabel>
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
                    <DatePickerFormField
                      name="childDateOfBirth"
                      label="childDateOfBirth"
                      namespace="Admissions"
                    />
                    <SelectFormField
                      name="childGender"
                      label="childGender"
                      options={genderOptions}
                      namespace="Admissions"
                    />
                  </div>
                  <TextareaFormField
                    name="childNotes"
                    label="childNotes"
                    namespace="Admissions"
                  />

                  <SectionLabel>{t("sectionApplication")}</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectFormField
                      name="admissionStageId"
                      label="initialStage"
                      namespace="Admissions"
                      options={stageOptions}
                      translateOptions={false}
                    />
                    <SelectFormField
                      name="admissionSourceId"
                      label="intakeChannel"
                      options={sourceOptions}
                      namespace="Admissions"
                      translateOptions={false}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {gradeLevelOptions.length > 0 && (
                      <SelectFormField
                        name="assignedGradeLevelId"
                        label="assignedGradeLevel"
                        namespace="Admissions"
                        options={gradeLevelOptions}
                        translateOptions={false}
                      />
                    )}
                    {schoolClasses.length > 0 && (
                      <SelectFormField
                        name="desiredSchoolClassId"
                        label="desiredSchoolClass"
                        namespace="Admissions"
                        options={schoolClassOptions}
                        translateOptions={false}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DatePickerFormField
                      name="desiredEnrollmentDate"
                      label="desiredEnrollmentDate"
                      namespace="Admissions"
                      // Enrollment dates lie in the future — only block the far
                      // past (default would block future dates).
                      disabledDate={(date) => date < new Date("1900-01-01")}
                    />
                  </div>

                  {/* Familie */}
                  <SectionLabel>{t("familySection")}</SectionLabel>
                  <p className="text-xs text-muted-foreground">
                    {t("familySectionHint")}
                  </p>
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

                {/* Right column — contact persons */}
                <div className="space-y-3.5">
                  <SectionLabel>{t("sectionContact")}</SectionLabel>
                  <p className="text-xs text-muted-foreground">
                    {t("primaryContactHint")}
                  </p>
                  <ContactPersonsFieldArray roleOptions={roleOptions} />
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
