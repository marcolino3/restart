"use client";

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
import { updateApplicationContactAction } from "../actions/update-application-contact.action";
import type { AdmissionApplicationDetail } from "../actions/get-application-detail.action";
import type { AdmissionSource } from "../types";
import type { GradeLevelOption } from "./CreateApplicationDialog";

/** Sentinel for "no selection" — Radix Select items cannot use an empty value. */
const NONE = "__none__";

const Schema = z.object({
  childFirstName: z.string().min(1),
  childLastName: z.string().min(1),
  assignedGradeLevelId: z.string().optional(),
  desiredSchoolClassId: z.string().optional(),
  desiredEnrollmentDate: z.date().nullable().optional(),
  childDateOfBirth: z.date().nullable().optional(),
  childGender: z.enum(["MALE", "FEMALE", "OTHER", NONE]).optional(),
  admissionSourceId: z.string().optional(),
  // Contact-person fields — only rendered (and submitted) when the
  // application has a first contact person.
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  contactEmail: z.string().email().or(z.literal("")).optional(),
  contactPhone: z.string().optional(),
  contactMobile: z.string().optional(),
  contactRole: z.string().optional(),
});

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

/**
 * Dialog to edit the "Angaben" card fields of an admission application:
 * child name/birthdate/gender, assigned grade level, desired class,
 * desired enrollment date, source — plus the primary contact person's
 * name, email, phone/mobile and role (saved via a separate mutation).
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

  const contact = detail.contactPersons[0] ?? null;
  const contactRole = contact?.roles?.[0] ?? null;

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
      contactFirstName: contact?.firstName ?? "",
      contactLastName: contact?.lastName ?? "",
      contactEmail: contact?.email ?? "",
      contactPhone: contact?.phone ?? "",
      contactMobile: contact?.mobile ?? "",
      contactRole: contactRole ?? NONE,
    },
  });

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

    // Contact fields go through their own mutation — only when the contact
    // exists and one of its fields was actually changed.
    const dirty = form.formState.dirtyFields;
    const contactDirty =
      contact &&
      (dirty.contactFirstName ||
        dirty.contactLastName ||
        dirty.contactEmail ||
        dirty.contactPhone ||
        dirty.contactMobile ||
        dirty.contactRole);
    if (contact && contactDirty) {
      // Replace only the first role, keep any additional roles untouched.
      const restRoles = (contact.roles ?? []).slice(1);
      const contactRes = await updateApplicationContactAction({
        id: contact.id,
        firstName: values.contactFirstName?.trim() || contact.firstName,
        lastName: values.contactLastName?.trim() || contact.lastName,
        email: values.contactEmail?.trim() || null,
        phone: values.contactPhone?.trim() || null,
        mobile: values.contactMobile?.trim() || null,
        roles:
          values.contactRole && values.contactRole !== NONE
            ? [values.contactRole, ...restRoles]
            : restRoles,
      });
      if (!contactRes.success) {
        toast.error(t("updateError"), { description: contactRes.error });
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
    ...gradeLevels.map((g) => ({
      value: g.id,
      label: g.shortCode ? `${g.name} (${g.shortCode})` : g.name,
    })),
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
  // The contact's current role may be outside the four offered ones
  // (e.g. GRANDMOTHER) — keep it selectable so it isn't silently dropped.
  if (contactRole && !roleOptions.some((o) => o.value === contactRole)) {
    roleOptions.push({ value: contactRole, label: contactRole });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[560px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{t("editDetails")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogBody className="space-y-3.5">
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

              {contact && (
                <>
                  <SectionLabel>{t("sectionContact")}</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <InputFormField
                      name="contactFirstName"
                      label="firstName"
                    />
                    <InputFormField name="contactLastName" label="lastName" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputFormField
                      name="contactEmail"
                      label="email"
                      type="email"
                    />
                    <SelectFormField
                      name="contactRole"
                      label="role"
                      options={roleOptions}
                      translateOptions={false}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputFormField name="contactPhone" label="phone" />
                    <InputFormField name="contactMobile" label="mobile" />
                  </div>
                </>
              )}
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
