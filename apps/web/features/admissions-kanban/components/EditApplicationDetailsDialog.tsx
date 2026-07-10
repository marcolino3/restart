"use client";

import { useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";

import { updateApplicationAction } from "../actions/update-application.action";
import { archiveApplicationContactAction } from "../actions/archive-application-contact.action";
import { updateApplicationContactAction } from "../actions/update-application-contact.action";
import { createApplicationContactAction } from "../actions/create-application-contact.action";
import type {
  AdmissionApplicationDetail,
  AdmissionDetailContact,
} from "../actions/get-application-detail.action";
import type { AdmissionSource } from "../types";
import type { GradeLevelOption } from "./CreateApplicationDialog";
import { buildGradeLevelOptions } from "../lib/grade-level-options";
import {
  ContactPersonsFieldArray,
  ContactSchema,
  NONE,
  refineContacts,
  type ContactFormValues,
} from "./ContactPersonsFieldArray";

const Schema = z
  .object({
    childFirstName: z.string().min(1),
    childLastName: z.string().min(1),
    assignedGradeLevelId: z.string().optional(),
    desiredSchoolClassId: z.string().optional(),
    desiredEnrollmentDate: z.date().nullable().optional(),
    childDateOfBirth: z.date().nullable().optional(),
    childGender: z.enum(["MALE", "FEMALE", "OTHER", NONE]).optional(),
    admissionSourceId: z.string().optional(),
    contacts: z.array(ContactSchema),
  })
  .superRefine((values, ctx) => refineContacts(values.contacts, ctx));

type FormValues = z.infer<typeof Schema>;

export interface SchoolClassOption {
  id: string;
  name: string;
}

interface Props {
  detail: AdmissionApplicationDetail;
  gradeLevels: GradeLevelOption[];
  schoolClasses: SchoolClassOption[];
  sources: AdmissionSource[];
  onClose: () => void;
}

/** Local-date ISO (yyyy-mm-dd) without UTC shifting the day backwards. */
const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** Small uppercase section label to group the dialog's fields. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-0">
      {children}
    </p>
  );
}

const contactToFormValues = (c: AdmissionDetailContact): ContactFormValues => ({
  id: c.id,
  firstName: c.firstName,
  lastName: c.lastName,
  email: c.email ?? "",
  phone: c.phone ?? "",
  mobile: c.mobile ?? "",
  role: c.roles?.[0] ?? NONE,
});

/** True when an existing contact's editable fields differ from the form row. */
const contactFieldsChanged = (
  original: AdmissionDetailContact,
  row: ContactFormValues,
): boolean =>
  row.firstName.trim() !== original.firstName ||
  row.lastName.trim() !== original.lastName ||
  (row.email.trim() || null) !== (original.email ?? null) ||
  (row.phone.trim() || null) !== (original.phone ?? null) ||
  (row.mobile.trim() || null) !== (original.mobile ?? null) ||
  row.role !== (original.roles?.[0] ?? NONE);

/**
 * Dialog to edit the "Angaben" card fields of an admission application:
 * child name/birthdate/gender, assigned grade level, desired class,
 * desired enrollment date, source — plus ALL of the family's contact
 * persons (editable, addable, reorderable; the first one is the primary
 * contact shown on the "Angaben" card).
 */
export function EditApplicationDetailsDialog({
  detail,
  gradeLevels,
  schoolClasses,
  sources,
  onClose,
}: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();

  // detail.childGender is a plain string in the detail type — narrow it to the
  // known enum values, anything else falls back to the none sentinel.
  const initialGender: FormValues["childGender"] =
    detail.childGender === "MALE" ||
    detail.childGender === "FEMALE" ||
    detail.childGender === "OTHER"
      ? detail.childGender
      : NONE;

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      childFirstName: detail.childFirstName,
      childLastName: detail.childLastName,
      assignedGradeLevelId: detail.assignedGradeLevelId ?? NONE,
      desiredSchoolClassId: detail.desiredSchoolClassId ?? NONE,
      desiredEnrollmentDate: detail.desiredEnrollmentDate
        ? new Date(detail.desiredEnrollmentDate)
        : null,
      childDateOfBirth: detail.childDateOfBirth
        ? new Date(detail.childDateOfBirth)
        : null,
      childGender: initialGender,
      admissionSourceId: detail.admissionSource?.id ?? NONE,
      contacts: detail.contactPersons.map(contactToFormValues),
    },
  });

  // Existing contact persons removed in this dialog — archived on save.
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const onSubmit = async (values: FormValues) => {
    const appRes = await updateApplicationAction({
      id: detail.id,
      childFirstName: values.childFirstName.trim(),
      childLastName: values.childLastName.trim(),
      assignedGradeLevelId:
        values.assignedGradeLevelId && values.assignedGradeLevelId !== NONE
          ? values.assignedGradeLevelId
          : null,
      desiredSchoolClassId:
        values.desiredSchoolClassId && values.desiredSchoolClassId !== NONE
          ? values.desiredSchoolClassId
          : null,
      desiredEnrollmentDate: values.desiredEnrollmentDate
        ? toIsoDate(values.desiredEnrollmentDate)
        : null,
      childDateOfBirth: values.childDateOfBirth
        ? toIsoDate(values.childDateOfBirth)
        : null,
      childGender:
        values.childGender && values.childGender !== NONE
          ? values.childGender
          : null,
      admissionSourceId:
        values.admissionSourceId && values.admissionSourceId !== NONE
          ? values.admissionSourceId
          : null,
    });
    if (!appRes.success) {
      toast.error(t("updateError"), { description: appRes.error });
      return;
    }

    // Existing persons removed from the list are archived (soft-removed).
    for (const removedId of removedIds) {
      const archiveRes = await archiveApplicationContactAction(removedId);
      if (!archiveRes.success) {
        toast.error(t("updateError"), { description: archiveRes.error });
        return;
      }
    }

    // Contact persons: list order = priority (index 0 is the primary contact).
    // Only changed persons are updated; new (non-empty) rows are created with
    // their list position as sortOrder.
    const originalById = new Map(detail.contactPersons.map((c) => [c.id, c]));
    // Completely empty new rows are skipped so positions stay contiguous.
    const rows = values.contacts.filter(
      (c) =>
        c.id !== null ||
        c.firstName.trim() ||
        c.lastName.trim() ||
        c.email.trim() ||
        c.phone.trim() ||
        c.mobile.trim(),
    );

    for (const [index, row] of rows.entries()) {
      if (!row.id) {
        const createRes = await createApplicationContactAction({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: row.email.trim() || null,
          phone: row.phone.trim() || null,
          mobile: row.mobile.trim() || null,
          roles: row.role && row.role !== NONE ? [row.role] : [],
          familyId: detail.familyId,
          sortOrder: index,
        });
        if (!createRes.success) {
          toast.error(t("updateError"), { description: createRes.error });
          return;
        }
        continue;
      }

      const original = originalById.get(row.id);
      if (!original) continue;
      const originalIndex = detail.contactPersons.indexOf(original);
      const fieldsChanged = contactFieldsChanged(original, row);
      const orderChanged =
        originalIndex !== index || original.sortOrder !== index;
      if (!fieldsChanged && !orderChanged) continue;

      // Replace only the first role, keep any additional roles untouched.
      const restRoles = (original.roles ?? []).slice(1);
      const updateRes = await updateApplicationContactAction({
        id: row.id,
        firstName: row.firstName.trim() || original.firstName,
        lastName: row.lastName.trim() || original.lastName,
        email: row.email.trim() || null,
        phone: row.phone.trim() || null,
        mobile: row.mobile.trim() || null,
        roles:
          row.role && row.role !== NONE
            ? [row.role, ...restRoles]
            : restRoles,
        sortOrder: index,
      });
      if (!updateRes.success) {
        toast.error(t("updateError"), { description: updateRes.error });
        return;
      }
    }

    toast.success(t("editDetailsSaved"));
    router.refresh();
    onClose();
  };

  const noneOption = { value: NONE, label: t("noneOption") };
  const gradeLevelOptions = [
    noneOption,
    ...buildGradeLevelOptions(gradeLevels),
  ];
  const schoolClassOptions = [
    noneOption,
    ...schoolClasses.map((c) => ({ value: c.id, label: c.name })),
  ];
  // Gender labels are i18n keys except the pre-translated none option.
  const genderOptions = [
    noneOption,
    { value: "MALE", label: t("genderMale") },
    { value: "FEMALE", label: t("genderFemale") },
    { value: "OTHER", label: t("genderOther") },
  ];
  // Intake channels from the org-configured list; archived ones drop out unless
  // this application still points at one (keep it selectable to avoid data loss).
  const sourceOptions = [
    noneOption,
    ...sources
      .filter(
        (s) => !s.isArchived || s.id === detail.admissionSource?.id,
      )
      .map((s) => ({ value: s.id, label: s.name })),
  ];
  const roleOptions = [
    noneOption,
    { value: "MOTHER", label: t("roleMother") },
    { value: "FATHER", label: t("roleFather") },
    { value: "LEGAL_GUARDIAN", label: t("roleLegalGuardian") },
    { value: "OTHER", label: t("roleOther") },
  ];
  // A contact's current role may be outside the four offered ones
  // (e.g. GRANDMOTHER) — keep it selectable so it isn't silently dropped.
  for (const cp of detail.contactPersons) {
    const role = cp.roles?.[0];
    if (role && !roleOptions.some((o) => o.value === role)) {
      roleOptions.push({ value: role, label: role });
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[900px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{t("editDetails")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogBody>
              {/* Two columns on wide screens: left = child + application,
                  right = contact persons. Stacks on narrow screens. */}
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
                  namespace="Admissions"
                  options={genderOptions}
                  translateOptions={false}
                />
              </div>

              <SectionLabel>{t("sectionApplication")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <SelectFormField
                  name="assignedGradeLevelId"
                  label="assignedGradeLevel"
                  namespace="Admissions"
                  options={gradeLevelOptions}
                  translateOptions={false}
                />
                <SelectFormField
                  name="desiredSchoolClassId"
                  label="desiredSchoolClass"
                  namespace="Admissions"
                  options={schoolClassOptions}
                  translateOptions={false}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DatePickerFormField
                  name="desiredEnrollmentDate"
                  label="desiredEnrollmentDate"
                  namespace="Admissions"
                  // Enrollment dates lie in the future — only block the far past.
                  disabledDate={(date) => date < new Date("1900-01-01")}
                />
                <SelectFormField
                  name="admissionSourceId"
                  label="intakeChannel"
                  namespace="Admissions"
                  options={sourceOptions}
                  translateOptions={false}
                />
              </div>

                </div>
                {/* Right column — contact persons */}
                <div className="space-y-3.5">
                  <SectionLabel>{t("sectionContact")}</SectionLabel>
                  <p className="text-xs text-muted-foreground">
                    {t("primaryContactHint")}
                  </p>
                  <ContactPersonsFieldArray
                    roleOptions={roleOptions}
                    onRemoveExisting={(id) =>
                      setRemovedIds((prev) => [...prev, id])
                    }
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {tC("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {tC("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
