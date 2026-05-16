"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";

import type { StudentDetail } from "../actions/get-student-by-id.action";
import type { EnrollmentItem } from "../actions/get-student-enrollments.action";
import type { StudentContactPersonItem } from "@/features/contact-persons/actions/get-student-contact-persons.action";
import type { ContactPersonListItem } from "@/features/contact-persons/actions/get-contact-persons.action";
import type { SchoolClassListItem } from "@/features/school-classes/actions/get-school-classes.action";
import type { StudentNoteItem } from "@/features/student-notes/actions/get-student-notes.action";
import {
  StudentFormSchema,
  StudentFormOutput,
} from "../schemas/student-form.schema";
import { updateStudentAction } from "../actions/update-student.action";
import { StudentEnrollmentsList } from "./StudentEnrollmentsList";
import { StudentContactPersonsList } from "./StudentContactPersonsList";
import StudentNotesFeed from "@/features/student-notes/components/StudentNotesFeed";
import StudentNotesTimeline from "@/features/student-notes/components/StudentNotesTimeline";
import CreateStudentNoteInline from "@/features/student-notes/components/CreateStudentNoteInline";

interface Props {
  student: StudentDetail;
  enrollments: EnrollmentItem[];
  schoolClasses: SchoolClassListItem[];
  contactPersonLinks: StudentContactPersonItem[];
  allContactPersons: ContactPersonListItem[];
  notes: StudentNoteItem[];
  studentName: string;
}

function getInitials(firstName?: string, lastName?: string): string {
  return (
    (firstName?.charAt(0)?.toUpperCase() ?? "") +
      (lastName?.charAt(0)?.toUpperCase() ?? "") || "?"
  );
}

export default function StudentEditView({
  student,
  enrollments,
  schoolClasses,
  contactPersonLinks,
  allContactPersons,
  notes,
  studentName,
}: Props) {
  const t = useTranslations("Common");
  const tS = useTranslations("Students");
  const tN = useTranslations("StudentNotes");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") ?? "overview",
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const form = useForm({
    resolver: zodResolver(StudentFormSchema),
    defaultValues: {
      id: student.id,
      firstName: student.firstName ?? "",
      lastName: student.lastName ?? "",
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
      gender: student.gender ?? "",
      enrollmentDate: student.enrollmentDate
        ? new Date(student.enrollmentDate)
        : null,
      exitDate: student.exitDate ? new Date(student.exitDate) : null,
      notes: student.notes ?? "",
    },
  });

  const onValid = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () => updateStudentAction(values as StudentFormOutput),
      successMessage: tS("studentUpdated"),
      errorMessage: tS("studentUpdateError"),
      onSuccess: () => {
        router.push(
          `${ROUTES.admin.studentsView(locale, student.id)}?tab=${activeTab}`,
        );
      },
    });
  };

  const onInvalid = (errors: Record<string, unknown>) => {
    console.warn("Student form validation errors:", errors);
    setActiveTab("overview");
    toast.error(tS("validationError"));
  };

  return (
    <div className="min-h-full">
      <main className="py-10">
        {/* Page header — identical layout to view page */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-7xl lg:px-8">
          <div className="flex items-center space-x-5">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() =>
                router.push(ROUTES.admin.studentsView(locale, student.id))
              }
              aria-label={t("back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="shrink-0">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {getInitials(student.firstName, student.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {tS("editStudent")} – {studentName}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                <span className="text-foreground">{t("STUDENT")}</span>
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            <Button variant="outline" asChild>
              <Link
                href={`${ROUTES.admin.studentsView(locale, student.id)}?tab=${activeTab}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("view")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="overview">{tS("overview")}</TabsTrigger>
              <TabsTrigger value="address" disabled>
                {t("address")}
              </TabsTrigger>
              <TabsTrigger value="enrollments">
                {tS("enrollments")}
              </TabsTrigger>
              <TabsTrigger value="contactPersons">
                {tS("contactPersons")}
              </TabsTrigger>
              <TabsTrigger value="logbook">{tN("logbook")}</TabsTrigger>
              <TabsTrigger value="documents" disabled>
                {tS("attachments")}
              </TabsTrigger>
              <TabsTrigger value="history" disabled>
                {tS("history")}
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onValid, onInvalid)}>
                <TabsContent value="overview">
                  <div className="px-4 sm:px-0">
                    <h3 className="text-base/7 font-semibold text-foreground">
                      {tS("overview")}
                    </h3>
                  </div>
                  <div className="mt-6 space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-sm font-medium text-foreground">
                        {tS("personalData")}
                      </h4>
                      <div className="flex gap-4">
                        <InputFormField
                          name="firstName"
                          label="firstName"
                          width="w-1/2"
                        />
                        <InputFormField
                          name="lastName"
                          label="lastName"
                          width="w-1/2"
                        />
                      </div>
                      <div className="flex gap-4">
                        <DatePickerFormField
                          name="dateOfBirth"
                          label="dateOfBirth"
                          width="w-1/2"
                        />
                        <SelectFormField
                          name="gender"
                          label="gender"
                          placeholder="selectPlaceholder"
                          options={[
                            { label: "MALE", value: "MALE" },
                            { label: "FEMALE", value: "FEMALE" },
                            { label: "OTHER", value: "OTHER" },
                          ]}
                          width="w-1/2"
                        />
                      </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                      <h4 className="text-sm font-medium text-foreground">
                        {tS("schoolData")}
                      </h4>
                      <div className="flex gap-4">
                        <DatePickerFormField
                          name="enrollmentDate"
                          label="enrollmentDate"
                          width="w-1/2"
                          disabledDate={(date) =>
                            date < new Date("1900-01-01")
                          }
                        />
                        <DatePickerFormField
                          name="exitDate"
                          label="exitDate"
                          width="w-1/2"
                          disabledDate={(date) =>
                            date < new Date("1900-01-01")
                          }
                        />
                      </div>
                      <InputFormField name="notes" label="notes" />
                    </section>
                  </div>
                  <FormActionButtons
                    disabled={form.formState.isSubmitting}
                    onCancel={() =>
                      router.push(
                        ROUTES.admin.studentsView(locale, student.id),
                      )
                    }
                  />
                </TabsContent>
              </form>
            </Form>

            {/* Enrollments */}
            <TabsContent value="enrollments">
              <StudentEnrollmentsList
                studentId={student.id}
                enrollments={enrollments}
                schoolClasses={schoolClasses}
              />
            </TabsContent>

            {/* Contact Persons */}
            <TabsContent value="contactPersons">
              <StudentContactPersonsList
                studentId={student.id}
                links={contactPersonLinks}
                allContactPersons={allContactPersons}
              />
            </TabsContent>

            {/* Logbook */}
            <TabsContent value="logbook">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <div className="bg-card shadow-sm sm:overflow-hidden sm:rounded-lg border">
                    <div className="divide-y divide-border">
                      <div className="px-4 py-5 sm:px-6">
                        <h2 className="text-lg font-medium text-foreground">
                          {tN("logbook")}
                        </h2>
                      </div>
                      <div className="px-4 py-6 sm:px-6">
                        <StudentNotesFeed notes={notes} />
                      </div>
                    </div>
                    <div className="bg-muted/50 px-4 py-6 sm:px-6">
                      <CreateStudentNoteInline studentId={student.id} />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <StudentNotesTimeline notes={notes} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
