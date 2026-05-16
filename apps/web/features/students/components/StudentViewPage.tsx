"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Paperclip } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/common/BackButton";
import { ROUTES } from "@/constants/routes";

import type { StudentDetail } from "../actions/get-student-by-id.action";
import type { EnrollmentItem } from "../actions/get-student-enrollments.action";
import type { StudentContactPersonItem } from "@/features/contact-persons/actions/get-student-contact-persons.action";
import type { ContactPersonListItem } from "@/features/contact-persons/actions/get-contact-persons.action";
import type { SchoolClassListItem } from "@/features/school-classes/actions/get-school-classes.action";
import type { StudentNoteItem } from "@/features/student-notes/actions/get-student-notes.action";
import { StudentEnrollmentsList } from "./StudentEnrollmentsList";
import { StudentContactPersonsList } from "./StudentContactPersonsList";
import StudentNotesFeed from "@/features/student-notes/components/StudentNotesFeed";
import StudentNotesTimeline from "@/features/student-notes/components/StudentNotesTimeline";
import CreateStudentNoteInline from "@/features/student-notes/components/CreateStudentNoteInline";

interface StudentViewPageProps {
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

export default function StudentViewPage({
  student,
  enrollments,
  schoolClasses,
  contactPersonLinks,
  allContactPersons,
  notes,
  studentName,
}: StudentViewPageProps) {
  const t = useTranslations("Common");
  const tS = useTranslations("Students");
  const tN = useTranslations("StudentNotes");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString(
      locale === "de" ? "de-CH" : "en-GB",
      { day: "numeric", month: "long", year: "numeric" },
    );
  };

  return (
    <div className="min-h-full">
      <main className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 mb-4">
          <BackButton
            href={ROUTES.admin.students(locale)}
            label={tS("backToStudents")}
          />
        </div>
        {/* Page header */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-7xl lg:px-8">
          <div className="flex items-center space-x-5">
            <div className="shrink-0">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {getInitials(student.firstName, student.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {studentName}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                <span className="text-foreground">{t("STUDENT")}</span>
                {student.enrollmentDate && (
                  <>
                    {" "}
                    {tS("since")}{" "}
                    <span className="text-foreground">
                      {formatDate(student.enrollmentDate)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="mt-6 flex md:mt-0">
            <Button asChild>
              <Link
                href={`${ROUTES.admin.studentsEdit(locale, student.id)}?tab=${activeTab}`}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t("edit")}
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

            {/* Overview */}
            <TabsContent value="overview">
              <div className="px-4 sm:px-0">
                <h3 className="text-base/7 font-semibold text-foreground">
                  {tS("overview")}
                </h3>
              </div>
              <div className="mt-6 border-t border-border">
                <dl className="divide-y divide-border">
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("firstName")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {student.firstName || "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("lastName")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {student.lastName || "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("dateOfBirth")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {formatDate(student.dateOfBirth)}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("gender")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {student.gender ? t(student.gender) : "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {tS("enrollmentDate")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {formatDate(student.enrollmentDate)}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {tS("exitDate")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {formatDate(student.exitDate)}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {tS("status")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {student.isActive ? t("active") : t("inactive")}
                    </dd>
                  </div>
                  {student.notes && (
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-foreground">
                        {t("notes")}
                      </dt>
                      <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0 whitespace-pre-wrap">
                        {student.notes}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </TabsContent>

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

            {/* Documents (placeholder) */}
            <TabsContent value="documents">
              <div className="px-4 sm:px-0">
                <h3 className="text-base/7 font-semibold text-foreground">
                  {tS("attachments")}
                </h3>
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <ul
                  role="list"
                  className="divide-y divide-border rounded-md border border-border"
                >
                  <li className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6">
                    <div className="flex w-0 flex-1 items-center">
                      <Paperclip
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                      />
                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                        <span className="truncate font-medium text-muted-foreground">
                          {tS("comingSoon")}
                        </span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
